# Context

A lot of infrastructure work comes down to resolving layered configuration: you take several config documents, stack them in a precedence order, merge them into one resolved result, and inject values from one part of that result into another.

A concrete version: a Pulumi stack emits output YAML (DB endpoints, bucket names, VPC IDs). A Helm-style values pipeline — base, then environment, then service overrides — needs those outputs injected before it can render. Different teams own different files; the resolved result has to be correct, and operators need to be able to trust and debug it.

# Your Task

Build a small, general-purpose layered config resolver that captures this shape.

## Stack N config layers in a precedence order and merge them into a single resolved document.

## Inject values from one part of the merged result into another.

## You design the format/schema and choose the language. Invent a few sample layers to exercise it.

## We provide a starter input pack: a representative set of layers in precedence order. Build against it. It reflects the kind of messiness real pipelines produce; treat anything surprising in it as part of the problem.

You should initialize a .git repository at the start and make meaningful commits as you develop your solution; we will review your git commit history and to help confirm the assignment was completed within the allotted window. If you submit a zip, please include the .git directory if possible. A gist is also fine if that is easiest.

# Tiers

## Tier 1: Stack & override (required):

### Merge an ordered set of layers (think base → environment → service overrides) into a single resolved document, where later layers take precedence where they overlap.

### Real layers overlap unevenly. Some keys appear in several, some in only one, and values range from plain scalars to nested structures and lists. Decide how overlapping values should combine, and make that behavior obvious in your tests.

## Tier 2: Cross-layer injection (required):

### Let a value in one layer reference a value resolved elsewhere in the merged document — the motivating case is a Pulumi output (one layer) being injected into a Helm value (another layer). References resolve against the final merged result, so they can point across layers and at values that are themselves derived.

### Not every reference is absolute. Some in the input pack are written relative to their own position in the document, so your resolver must handle both. Pick a reference syntax and decide how it should behave at the edges.

## Tier 3: Nested structures (stretch):

### Extend the model so layers can contain nested, composed sub-documents. For example, a service that holds a list of components, each with its own config block.

### Merging and injection should keep working at depth, not just at the top level. This is the tier where a clean, separable design pays off, and it's the closest preview of what we'll ask you to extend on-site.
