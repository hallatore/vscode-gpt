import * as assert from "assert";
import * as path from "path";
import * as fs from "fs";
import DocumentInformation, {
  LineMetadata,
} from "../../../code-generation/core/DocumentInformation";

suite("Metadata generation tests", () => {
  const codeBlock1 = fs.readFileSync(
    path.join(__dirname, "./codeBlock1.txt"),
    "utf-8"
  );

  const documentInformation: any = new DocumentInformation();

  test("Get top level lines", () => {
    const lines = documentInformation.getTopLevelLines(codeBlock1);

    assert.strictEqual(lines.length, 9);

    assert.strictEqual(lines[0].line, 1);
    assert.strictEqual(
      lines[0].text,
      "import React, { useEffect } from 'react';"
    );

    assert.strictEqual(lines[8].line, 39);
    assert.strictEqual(lines[8].text, "export default RateAppDialog;");
  });

  test("Get lines around selection - 1", () => {
    const lines = documentInformation.getLinesAroundSelection(
      0,
      0,
      codeBlock1,
      3
    );

    assert.strictEqual(lines.length, 4, "Expected 4 lines");

    assert.strictEqual(lines[0].line, 1, "Expected line 1");
    assert.strictEqual(
      lines[0].text,
      "import React, { useEffect } from 'react';"
    );

    assert.strictEqual(lines[3].line, 4, "Expected line 4");
    assert.strictEqual(
      lines[3].text,
      "import { Capacitor } from '@capacitor/core';"
    );
  });

  test("Get lines around selection - 2", () => {
    const lines = documentInformation.getLinesAroundSelection(
      10,
      10,
      codeBlock1,
      3
    );

    assert.strictEqual(lines.length, 7, "Expected 7 lines");

    assert.strictEqual(lines[0].line, 8, "Expected line 8");
    assert.strictEqual(lines[0].text, "    margin: 0 auto;");

    assert.strictEqual(lines[6].line, 14, "Expected line 14");
    assert.strictEqual(lines[6].text, "`;");
  });

  test("Get lines around selection - 3", () => {
    const lines = documentInformation.getLinesAroundSelection(
      10,
      12,
      codeBlock1,
      3
    );

    assert.strictEqual(lines.length, 9, "Expected 9 lines");

    assert.strictEqual(lines[0].line, 8, "Expected line 8");
    assert.strictEqual(lines[0].text, "    margin: 0 auto;");

    assert.strictEqual(lines[8].line, 16, "Expected line 16");
    assert.strictEqual(
      lines[8].text,
      "const HAS_SEEN_RATE_APP = 'hasSeenRateApp';"
    );
  });

  test("Get lines around selection - 4", () => {
    const lines = documentInformation.getLinesAroundSelection(
      10,
      10,
      codeBlock1,
      0
    );

    assert.strictEqual(lines.length, 1, "Expected 1 lines");

    assert.strictEqual(lines[0].line, 11, "Expected line 8");
    assert.strictEqual(
      lines[0].text,
      "export const OtherContainer = styled(CenteredPageContent)`"
    );
  });

  test("Get lines around selection - 5", () => {
    const lines = documentInformation.getLinesAroundSelection(
      0,
      39,
      codeBlock1,
      0
    );

    assert.strictEqual(lines.length, 40, "Expected 1 lines");

    assert.strictEqual(lines[0].line, 1, "Expected line 1");
    assert.strictEqual(
      lines[0].text,
      "import React, { useEffect } from 'react';"
    );

    assert.strictEqual(lines[39].line, 40, "Expected line 40");
    assert.strictEqual(lines[39].text, "");
  });

  test("Get combined lines", () => {
    let lines: LineMetadata[] = [];
    // lines = getStyledComponents(codeBlock1);
    // lines = lines.concat(getFunctions(codeBlock1));
    // lines = lines.concat(getImports(codeBlock1));
    lines = lines.concat(documentInformation.getTopLevelLines(codeBlock1));
    lines = lines.concat(
      documentInformation.getLinesAroundSelection(10, 10, codeBlock1, 3)
    );
    lines = documentInformation.reduceAndSortLines(lines);

    assert.strictEqual(lines.length, 15, "Expected 15 lines");

    assert.strictEqual(lines[0].line, 1, "Expected line 1");
    assert.strictEqual(
      lines[0].text,
      "import React, { useEffect } from 'react';"
    );

    assert.strictEqual(lines[8].line, 11, "Expected line 11");
    assert.strictEqual(
      lines[8].text,
      "export const OtherContainer = styled(CenteredPageContent)`"
    );

    assert.strictEqual(lines[14].line, 39, "Expected line 39");
    assert.strictEqual(lines[14].text, "export default RateAppDialog;");
  });
});
