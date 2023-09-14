import * as assert from "assert";
import TypescriptImportsParser from "../../../code-generation/typescript/TypescriptImportsParser";

suite("Typescript parse result tests", () => {
  const typescriptImportsParser = new TypescriptImportsParser();

  test("Test 1", () => {
    const codeBlock = `
import * as assert from "module1";
import path from "module2";
import { item } from "module3";
import { item, item2 } from "module4";
import {
LineMetadata,
getLinesAroundSelection,
getTopLevelLines,
reduceAndSortLines,
} from "../../../code-generation/metadataGeneration";
    `
      .replace(/^[\r\n]+/, "")
      .replace(/[\r\n]+$/, "");
    const codeResult = typescriptImportsParser.combineNewAndOldImports(
      codeBlock,
      codeBlock
    );
    assert.strictEqual(codeResult.length, 0);
  });

  test("Test 2", () => {
    const oldImports = `
import * as assert from "module1";
import path from "module2";
import { item } from "module3";
import { item, item2 } from "module4";
import {
LineMetadata,
getLinesAroundSelection,
getTopLevelLines,
reduceAndSortLines,
} from "../../../code-generation/metadataGeneration";
    `
      .replace(/^[\r\n]+/, "")
      .replace(/[\r\n]+$/, "");

    const newImports = `
import { item } from "module1";
import { item } from "module3";
import path from "module5";
import {
reduceAndSortLines,
extraStuff
} from "../../../code-generation/metadataGeneration";
    `
      .replace(/^[\r\n]+/, "")
      .replace(/[\r\n]+$/, "");

    const codeResult = typescriptImportsParser.combineNewAndOldImports(
      newImports,
      oldImports
    );
    assert.strictEqual(codeResult.length, 3);

    assert.strictEqual(codeResult[0].key, 'import * as assert from "module1";');
    assert.strictEqual(
      codeResult[0].value,
      'import * as assert, { item } from "module1";'
    );

    assert.strictEqual(codeResult[1].key, "");
    assert.strictEqual(codeResult[1].value, 'import path from "module5";');

    assert.strictEqual(
      codeResult[2].key,
      `import {
LineMetadata,
getLinesAroundSelection,
getTopLevelLines,
reduceAndSortLines,
} from "../../../code-generation/metadataGeneration";`,
      "codeResult[2].key"
    );
    assert.strictEqual(
      codeResult[2].value,
      'import { reduceAndSortLines, extraStuff, LineMetadata, getLinesAroundSelection, getTopLevelLines } from "../../../code-generation/metadataGeneration";',
      "codeResult[2].value"
    );
  });
});
