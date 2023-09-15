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

export const chatCompletionStream = async (
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  streamCallback: (message: string) => void,
  cancellationToken: vscode.CancellationToken
) => {
  const stream = await getOpenAiContext().chat.completions.create({
    messages: messages,
    model: getModel(),
    top_p: 0,
    max_tokens: 2000,
    stream: true,
  });

  for await (const part of stream) {
    streamCallback(part.choices[0]?.delta?.content || "");

    if (cancellationToken.isCancellationRequested) {
      stream.controller.abort();
    }
  }
};
