import data from '../../licenses.json';

type PackageDetails = {
    name?: string;
    version?: string;
    publisher?: string;
    repository?: string;
    licenses?: string;
    licenseText?: string;
};

export default function Licenses() {
    const list = Object.entries(data).map(([_name, value]) => {
        return value as PackageDetails;
    });
    const unknown = <i>unknown</i>;
    return (
        <>
            <h1>Third Party Licenses</h1>
            <a href="/">Back To Start</a>
            <table>
                <tbody>
                    <tr>
                        <th>Package</th>
                        <th>Version</th>
                        <th>License</th>
                        <th>Publisher</th>
                        <th>Repository</th>
                        <th>Text</th>
                    </tr>
                    {list.map((item) =>
                        <tr>
                            <th scope="row">{item.name}</th>
                            <td>{item.version || unknown}</td>
                            <td>{item.licenses || unknown}</td>
                            <td>{item.publisher || unknown}</td>
                            <td>
                                {item.repository ?
                                    <a target="_blank" rel="noopener nofollow noreferrer" href={item.repository}>{item.repository}</a>
                                    :
                                    unknown
                                }
                            </td>
                            <td>
                                {item.licenseText ?
                                    <details>
                                        <summary>Text</summary>
                                        <pre>{item.licenseText}</pre>
                                    </details>
                                    :
                                    unknown
                                }
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

        </>
    );
}