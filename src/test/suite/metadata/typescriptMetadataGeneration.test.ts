import * as assert from "assert";
import * as path from "path";
import * as fs from "fs";
import TypescriptDocumentInformation from "../../../code-generation/typescript/TypescriptDocumentInformation";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as myExtension from '../../extension';

suite("Typescript Metadata generation tests", () => {
  const codeBlock1 = fs.readFileSync(
    path.join(__dirname, "./codeBlock1.txt"),
    "utf-8"
  );

  const documentInformation: any = new TypescriptDocumentInformation();

  test("Get functions", () => {
    const lines = documentInformation.getFunctions(codeBlock1);

    assert.strictEqual(lines.length, 1);

    assert.strictEqual(lines[0].line, 18);
    assert.strictEqual(
      lines[0].text,
      "const RateAppDialog: React.FC = () => {"
    );
  });
});
