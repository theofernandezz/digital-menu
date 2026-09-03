"use client";

import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";

// Vendored Radix Toggle Group — unstyled behavior only (multi-select,
// keyboard nav, aria-pressed). Third-party primitive, not a layer of the
// Atomic Design tree — mirrors how components/ui/dialog.tsx is vendored.
export const ToggleGroup = ToggleGroupPrimitive.Root;
export const ToggleGroupItem = ToggleGroupPrimitive.Item;
