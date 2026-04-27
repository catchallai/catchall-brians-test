// Ambient type shim for the Base44 SDK npm package as used inside Deno
// functions. The published SDK's `entities`, `asServiceRole`, and
// `functions` surfaces are typed as empty objects, which produces hundreds
// of spurious TS2339 errors during `deno check`. The runtime API exists
// and is documented in the Base44 dashboard; loosening to `any` here keeps
// `deno check` useful for catching real bugs in our own code without
// rewriting the SDK types.

// Cover every SDK version pinned across the 76 backend functions. When a new
// version starts being used, add a corresponding declaration here.
declare module 'npm:@base44/sdk@0.8.4' {
  export function createClientFromRequest(req: Request): any;
}
declare module 'npm:@base44/sdk@0.8.6' {
  export function createClientFromRequest(req: Request): any;
}
declare module 'npm:@base44/sdk@0.8.20' {
  export function createClientFromRequest(req: Request): any;
}
declare module 'npm:@base44/sdk@0.8.21' {
  export function createClientFromRequest(req: Request): any;
}
declare module 'npm:@base44/sdk@0.8.26' {
  export function createClientFromRequest(req: Request): any;
}
