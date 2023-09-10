/* eslint-disable @typescript-eslint/naming-convention */
import OpenAI from "openai";
import * as vscode from "vscode";

const getOpenAiContext = () => {
  const config = vscode.workspace.getConfiguration("vscode-gpt");
  const apiKey = config.get<string>("apiKey");

  return new OpenAI({
    apiKey: apiKey,
  });
};

const getModel = () => {
  const config = vscode.workspace.getConfiguration("vscode-gpt");
  return config.get<string>("model")!;
};

export const chatCompletion = async (
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
): Promise<string | null> => {
  const completion = await getOpenAiContext().chat.completions.create({
    messages: messages,
    model: getModel(),
    top_p: 0,
    max_tokens: 2000,
  });

  return completion.choices[0].message.content;
};
