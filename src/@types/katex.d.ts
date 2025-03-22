declare module 'katex' {
  interface KatexOptions {
    displayMode?: boolean;
    throwOnError?: boolean;
    output?: string;
    leqno?: boolean;
    fleqn?: boolean;
    strict?: boolean | string | ((_: string) => string);
    trust?: boolean | ((context: { command: string; url: string; protocol: string }) => boolean);
    macros?: { [key: string]: string };
    minRuleThickness?: number;
    colorIsTextColor?: boolean;
    maxSize?: number;
    maxExpand?: number;
    errorColor?: string;
  }

  function render(tex: string, element: HTMLElement, options?: KatexOptions): void;
  function renderToString(tex: string, options?: KatexOptions): string;

  export default {
    render,
    renderToString
  };
}
