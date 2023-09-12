import * as assert from "assert";
import * as path from "path";
import * as fs from "fs";
import {
  getFunctions,
  getImports,
  getStyledComponents,
} from "../../../code-generation/typescript/metadataGeneration";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as myExtension from '../../extension';

suite("Typescript Metadata generation tests", () => {
  const codeBlock1 = fs.readFileSync(
    path.join(__dirname, "./codeBlock1.txt"),
    "utf-8"
  );

  test("Get imports", () => {
    const lines = getImports(codeBlock1);

    assert.strictEqual(lines.length, 4);

    assert.strictEqual(lines[0].line, 1);
    assert.strictEqual(
      lines[0].text,
      "import React, { useEffect } from 'react';"
    );

    assert.strictEqual(lines[1].line, 2);
    assert.strictEqual(
      lines[1].text,
      "import { RateApp } from 'capacitor-rate-app';"
    );

    assert.strictEqual(lines[3].line, 4);
    assert.strictEqual(
      lines[3].text,
      "import { Capacitor } from '@capacitor/core';"
    );
  });

  test("Get functions", () => {
    const lines = getFunctions(codeBlock1);

    assert.strictEqual(lines.length, 1);

    assert.strictEqual(lines[0].line, 18);
    assert.strictEqual(
      lines[0].text,
      "const RateAppDialog: React.FC = () => {"
    );
  });

  test("Get styled-components", () => {
    const lines = getStyledComponents(codeBlock1);

    assert.strictEqual(lines.length, 2);

    assert.strictEqual(lines[0].line, 6);
    assert.strictEqual(
      lines[0].text,
      "export const CenteredPageContent = styled.div`"
    );

    assert.strictEqual(lines[1].line, 11);
    assert.strictEqual(
      lines[1].text,
      "export const OtherContainer = styled(CenteredPageContent)`"
    );
  });
});
