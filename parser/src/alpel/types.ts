export type AlpelValue = string | number | boolean | null | AlpelValue[] | { [k: string]: AlpelValue };

export interface EvalContext {
  [key: string]: AlpelValue;
}
