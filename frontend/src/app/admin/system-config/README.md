# System Config Page - Refactored Structure

This directory contains the refactored System Config page for managing rubrics and evaluation criteria.

## File Structure

```
system-config/
├── page.tsx                    # Main page component
├── types.ts                    # Shared TypeScript interfaces
├── components/
│   ├── RubricList.tsx         # Left sidebar - list of rubrics
│   ├── RubricEditor.tsx       # Right panel - rubric editing form
│   ├── CriteriaItem.tsx       # Individual criteria item component
│   └── SubCriteriaRenderer.tsx # Sub-criteria rendering component
└── README.md                   # This file
```

## Components Overview

### `page.tsx`

- Main container component
- Manages state for rubrics, criteria, and form data
- Handles API calls and business logic
- Coordinates between child components

### `RubricList.tsx`

- Displays list of available rubrics
- Handles rubric selection and deletion
- Shows active status and basic info

### `RubricEditor.tsx`

- Main editing interface for rubrics
- Contains rubric form fields and criteria management
- Handles save/cancel operations

### `CriteriaItem.tsx`

- Individual criteria editing component
- Manages criteria properties and sub-criteria
- Handles expansion/collapse of sub-criteria sections

### `SubCriteriaRenderer.tsx`

- Renders list of sub-criteria for a criteria item
- Handles sub-criteria editing and deletion
- Shows empty state when no sub-criteria exist

### `types.ts`

- Shared TypeScript interfaces
- Ensures type consistency across components
- Defines `SubCriteriaFormData`, `CriteriaFormData`, and `RubricFormData`

## Key Features

1. **Modular Design**: Each component has a single responsibility
2. **Type Safety**: Shared types ensure consistency
3. **Maintainable**: Small, focused components are easier to debug and modify
4. **Reusable**: Components can be easily reused or extended
5. **Clean Code**: Separation of concerns and clear interfaces

## Benefits of Refactoring

- **Fixed Parsing Error**: Removed duplicate code that caused build issues
- **Better Organization**: Logic is separated into focused components
- **Easier Debugging**: Smaller components are easier to troubleshoot
- **Improved Maintainability**: Changes can be made to individual components without affecting others
- **Type Safety**: Shared types prevent type-related bugs
- **Better Performance**: Smaller components can be optimized individually
