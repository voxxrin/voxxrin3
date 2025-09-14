import {z, ZodIssue} from "zod";
import {GoogleAuth} from "google-auth-library";
import {sheets as googleSheets, sheets_v4} from "@googleapis/sheets";

export type ColumnDescriptor<PARSER extends z.ZodTypeAny = z.ZodTypeAny> = { col: string, parser: PARSER }

export type GSheetReaderDescriptor<COLS_DESCRIPTOR extends FullColDescriptor = FullColDescriptor> = {
  sheetName: string,
  firstRowIsHeader: boolean,
  minRow: number, maxRow?: number|undefined,
  cols: COLS_DESCRIPTOR,
  ignoreRowWhen: (rowType: Partial<GSheetRowType<COLS_DESCRIPTOR>>) => boolean,
}

export type GSheetDescriptors = Record<string, GSheetReaderDescriptor>;

export type GSheetDescriptorOf<DESC extends GSheetDescriptors, NAME extends keyof DESC> = DESC[NAME];
export type GSheetFullColDescriptorOf<DESC extends GSheetDescriptors, NAME extends keyof DESC> = FullColDescriptorOf<GSheetDescriptorOf<DESC, NAME>['cols']>;
export type GSheetRowType<FULL_COLS_DESCRIPTOR extends FullColDescriptor> = {
  [key in keyof FULL_COLS_DESCRIPTOR & string]: z.infer<FULL_COLS_DESCRIPTOR[key]['parser']>
}

type ColDescriptor = Record<string, string | ColumnDescriptor>;
type FullColDescriptor = Record<string, ColumnDescriptor>;

type FullColDescriptorOf<COL_DESC extends ColDescriptor = ColDescriptor> = {
  -readonly [colDescriptorKey in keyof COL_DESC]: COL_DESC[colDescriptorKey] extends `${infer COL_NAME}?`
    ? { col: COL_NAME, parser: z.ZodOptional<z.ZodString> }
    : COL_DESC[colDescriptorKey] extends string
      ? { col: COL_DESC[colDescriptorKey], parser: z.ZodString }
      : { -readonly [fieldName in keyof COL_DESC[colDescriptorKey]]: COL_DESC[colDescriptorKey][fieldName]};
}

type GSheetReaderDescriptorResults<DESC extends GSheetDescriptors> = {
  [key in keyof DESC]: GSheetRowType<GSheetFullColDescriptorOf<DESC, key>>[]
}

export function createDescriptor<COLS_DESCRIPTOR extends FullColDescriptor>(descriptor: GSheetReaderDescriptor<COLS_DESCRIPTOR>): GSheetReaderDescriptor<COLS_DESCRIPTOR> {
  return descriptor;
}

export function createColDescriptor<const PARAM extends ColDescriptor>(params: PARAM): FullColDescriptorOf<PARAM> {
  const fullColDescriptors = Object.fromEntries(
    Object.entries(params).map(([key, value]) =>
      [
        key,
        typeof value !== 'string'
          ? value
          : value[value.length -1] === "?"
            ? { col: value.substring(0, value.length-1), parser: z.string().optional() }
            : { col: value, parser: z.string() }
      ]
    )
  ) as FullColDescriptorOf<PARAM>;

  return fullColDescriptors;
}

const GOOGLE_JSON_KEY_PARSER = z.object({
  project_id: z.string(),
  type: z.string(),
  client_email: z.string(),
  private_key_id: z.string(),
  private_key: z.string(),
  client_id: z.string(),
  universe_domain: z.string(),
})

function buildRangesFrom(descriptor: GSheetReaderDescriptor) {
  return Object.entries(descriptor.cols).map(([fieldName, {col}]) => `'${descriptor.sheetName}'!${col}${descriptor.minRow}:${col}${descriptor.maxRow || ''}`);
}

type CellParsingError = { cell: string, fieldName: string, error: Array<Omit<ZodIssue, 'path'>> }

export class GSheetReader<DESC extends GSheetDescriptors> {
  private readonly sheets: sheets_v4.Sheets;

  constructor(private readonly descriptor: DESC) {
    if(!process.env.GSHEETS_SA_KEY) {
      throw new Error('Missing GSHEETS_SA_KEY env variable !')
    }

    const authCredentials = GOOGLE_JSON_KEY_PARSER.parse(JSON.parse(process.env.GSHEETS_SA_KEY));
    const auth = new GoogleAuth({
      credentials: authCredentials,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets.readonly',
      ]
    })

    this.sheets = googleSheets({ auth, version: 'v4' });
  }

  async readAll(gsheetId: string) {
    const promiseResults = await Promise.allSettled(
      Object.keys(this.descriptor).map(async fieldName => ({
          content: await this.read(gsheetId, fieldName as keyof DESC & string),
          fieldName,
      }))
    );

    const reasons = promiseResults.map(result => result.status === 'rejected'
      ? result.reason
      : undefined
    ).filter(reason => !!reason);
    if (reasons.length > 0) {
      throw new Error('Failed to read GSheets: ' + reasons.map(error => error.message).join(', '));
    }

    const byDescriptorNameResults = promiseResults
      .map(result => result.status === 'fulfilled' ? result.value : undefined)
      .filter(value => !!value)
      .map(value => value!)
      .reduce((byDescriptorNameResult, promiseResult) => {
        const key: keyof DESC & string = promiseResult.fieldName;
        byDescriptorNameResult[key] = promiseResult.content;
        return byDescriptorNameResult;
      }, {} as Partial<GSheetReaderDescriptorResults<DESC>>) as GSheetReaderDescriptorResults<DESC>;

    return byDescriptorNameResults;
  }

  async read<NAME extends string & keyof DESC>(spreadsheetId: string, name: NAME) {
    const descriptor: GSheetReaderDescriptor = this.descriptor[name];
    const ranges = buildRangesFrom(descriptor)
    const response = await this.sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
      majorDimension: 'ROWS',
    });

    const valueRanges = response.data.valueRanges;
    if(!valueRanges) {
      throw new Error(`No data found for gsheet ranges:${ranges.join(", ")} (corresponding to name:${name})`);
    }

    const valuesResult = this.extractValuesForRows(name, valueRanges);

    if(!valuesResult.success) {
      throw new Error(`Failed to parse data for named range ${name} (gsheet ranges:${ranges.join(", ")})\nErrors:${JSON.stringify(valuesResult.errors, null, 2)}`);
    }

    return valuesResult.values;
  }

  private extractValuesForRows<NAME extends string & keyof DESC>(
    name: NAME, valueRanges: sheets_v4.Schema$ValueRange[]
  ): { success: true, values: Array<GSheetRowType<GSheetFullColDescriptorOf<DESC, NAME>>> } | { success: false, errors: CellParsingError[] } {
    const maxRows = Math.max(...valueRanges.map((valueRange) => valueRange.values?.length || 0));
    const valuesResults = Array(maxRows).fill(null).map((_, rowIndex) =>
      this.extractValuesForRow(name, valueRanges, rowIndex)
    );

    const descriptor = this.descriptor[name];
    if(descriptor.firstRowIsHeader) {
      const headers = valuesResults.shift();
    }

    const nonIgnoredValuesResults = valuesResults.filter(valuesResult => {
      if(!descriptor.ignoreRowWhen) {
        return true;
      }

      if(valuesResult.success) {
        return !descriptor.ignoreRowWhen(valuesResult.values);
      } else {
        return !descriptor.ignoreRowWhen(valuesResult.partialValues);
      }
    });

    const errors = nonIgnoredValuesResults.flatMap(result => result.success ? [] : result.errors);
    if(errors.length) {
      return {success: false, errors};
    } else {
      const nonIgnoredValues = nonIgnoredValuesResults.map(result => {
        if(result.success) {
          return result.values;
        } else {
          throw new Error("Should never happen")
        }
      });

      return {
        success: true,
        values: nonIgnoredValues,
      };
    }
  }

  private extractValuesForRow<NAME extends string & keyof DESC>(
    name: NAME, valueRanges: sheets_v4.Schema$ValueRange[], rowIndex: number
  ): { success: true, values: GSheetRowType<GSheetFullColDescriptorOf<DESC, NAME>> } | { success: false, errors: CellParsingError[], partialValues: Partial<GSheetRowType<GSheetFullColDescriptorOf<DESC, NAME>>> } {
    const descriptor = this.descriptor[name];
    const {values, errors} = Object.entries(this.descriptor[name].cols).reduce(
      ({values, errors}, [fieldName, colDescriptor], colIndex) => {
        const valueRange = valueRanges[colIndex];
        const parsingResult = colDescriptor.parser.safeParse(valueRange?.values?.[rowIndex]?.[0]);
        if(parsingResult.success) {
          values[fieldName as keyof GSheetRowType<GSheetFullColDescriptorOf<DESC, NAME>>] = parsingResult.data;
        } else {
          errors.push({
            cell: `'${descriptor.sheetName}'!${descriptor.cols[fieldName].col}${descriptor.minRow + rowIndex}`,
            error: parsingResult.error.issues.map(issue => {
              const { path, ...rest } = issue;
              return rest;
            }),
            fieldName,
          });
        }
        return {values, errors};
      }, { values: {} as Partial<GSheetRowType<GSheetFullColDescriptorOf<DESC, NAME>>>, errors: [] as CellParsingError[] }
    );

    if(errors.length) {
      return {success: false, errors, partialValues: values };
    } else {
      return {success: true, values: values as GSheetRowType<GSheetFullColDescriptorOf<DESC, NAME>>};
    }
  }

}

