import { parse as parseYaml } from 'yaml'
import {http} from "../utils";


type BaseGithubDirectoryEntry = {
    "name": string,
    "path": string,
    "sha": string,
    "size": number,
    "url": string,
    "html_url": string,
    "git_url": string,
    "_links": {
        "self": string,
        "git": string,
        "html": string
    }
}
type GithubFile = BaseGithubDirectoryEntry & {
    "download_url": string,
    "type": "file",
}
type GithubDirectory = BaseGithubDirectoryEntry & {
    "download_url": null,
    "type": "dir",
}

type MdxFile = {
    metadata: object,
    content: string,
}

type GithubDirectoryEntry = GithubFile | GithubDirectory;


export class GithubMDXCrawler {
    constructor(readonly organization: string, readonly repositoryName: string) {
    }

    async crawlDirectory<T>(repositoryDirectoryPath: string, mdxParser: (mdxFile: MdxFile, fileEntry: GithubFile) => T): Promise<T[]> {
        const directoryEntries: GithubDirectoryEntry[] = await http.get(`https://api.github.com/repos/${this.organization}/${this.repositoryName}/contents/${repositoryDirectoryPath}`);

        const results = (await Promise.all(directoryEntries
            .map(async fileEntry => {
                if(fileEntry.type === 'file') {
                    const mdxContent = await http.getAsText(fileEntry.download_url)
                    const [ _, mdxYamlRawMetadata, content ] = mdxContent.split("---")
                    const mdxMetadataData = parseYaml(mdxYamlRawMetadata);
                    return await mdxParser({ metadata: mdxMetadataData, content: content.trimStart() }, fileEntry);
                } else {
                    return undefined;
                }
            })
        )).filter(result => !!result).map(result => result!)

        return results;
    }
}
