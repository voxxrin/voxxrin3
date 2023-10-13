import axios from "axios";
import { parse as parseYaml } from 'yaml'


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
        const directoryEntries: GithubDirectoryEntry[] = (await axios.get(`https://api.github.com/repos/${this.organization}/${this.repositoryName}/contents/${repositoryDirectoryPath}`, {responseType: 'json'})).data;

        const results = (await Promise.all(directoryEntries
            .map(async fileEntry => {
                if(fileEntry.type === 'file') {
                    const mdxContent = (await axios.get(fileEntry.download_url, {responseType:'text'})).data
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
