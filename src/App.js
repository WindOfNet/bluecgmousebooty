import { useState } from "react";
import iconv from "iconv-lite";
import { groupBy, keys } from "lodash";
import ReactTooltip from "react-tooltip";
import "@fortawesome/fontawesome-free/css/fontawesome.css";
import "@fortawesome/fontawesome-free/css/brands.css";
import "@fortawesome/fontawesome-free/css/solid.css";

const readFileText = (file) =>
  new Promise((resolve) => {
    const fr = new FileReader();
    fr.onload = () => {
      const buffer = new Uint8Array(fr.result);
      resolve(iconv.decode(buffer, "big5"));
    };
    fr.readAsArrayBuffer(file);
  });

function App() {
  const [data, setData] = useState(null);
  const [tooltip, showTooltip] = useState(true);
  const [processing, setProcessing] = useState(false);

  return (
    <div>
      <label for="upload">select bluecg log files: </label>
      <input
        id="upload"
        type="file"
        multiple
        accept=".txt"
        onChange={async (e) => {
          const targets = [];
          try {
            setProcessing(true);
            for (const file of e.target.files) {
              const text = await readFileText(file);
              const lines = text.split("\n");

              for (const line of lines) {
                if (line.includes("交出了 遊行禮盒。")) {
                  targets.push(
                    /獲得了 (.*) 。/.exec(lines[lines.indexOf(line) + 1])[1]
                  );
                }
              }
            }

            setData(targets);
          } catch {
            alert("error ...");
          } finally {
            setProcessing(false);
          }
        }}
      />
      <hr />
      {processing && "... analysing ..."}
      {!processing &&
        data &&
        ((keys(data).length === 0 && "not found") || (
          <table>
            <thead>
              <tr>
                <th>item</th>
                <th>count</th>
              </tr>
            </thead>
            <tbody>
              {data &&
                (() => {
                  const groupedData = groupBy(data, (v) => {
                    if (/(.*)經驗(.*)手環(.*)/.test(v)) {
                      return "經驗手環";
                    }

                    return v;
                  });

                  return keys(groupedData).map((item, index) => (
                    <tr key={index}>
                      <td>{item}</td>
                      <td align="right">
                        <div>
                          {groupedData[item].length}
                          {item === "經驗手環" && (
                            <>
                              <i
                                className="fa-solid fa-list"
                                style={{ marginLeft: 5 }}
                                onMouseEnter={() => showTooltip(true)}
                                onMouseLeave={() => {
                                  showTooltip(false);
                                  setTimeout(() => showTooltip(true), 50);
                                }}
                                data-tip={(() => {
                                  const g = groupBy(groupedData[item]);
                                  return keys(g)
                                    .map((x) => `${x}: ${g[x].length}`)
                                    .join("<br />");
                                })()}
                              ></i>
                              {tooltip && (
                                <ReactTooltip multiline place="right" />
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              <tr>
                <td colSpan={2} align="right">
                  total: {data.length}
                </td>
              </tr>
            </tbody>
          </table>
        ))}
    </div>
  );
}

export default App;
