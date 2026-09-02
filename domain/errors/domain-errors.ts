export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class InvalidCategoryNameError extends DomainError {
  constructor() {
    super("Category name cannot be empty");
    this.name = "InvalidCategoryNameError";
  }
}

export class InvalidDisplayOrderError extends DomainError {
  constructor() {
    super("Display order cannot be negative");
    this.name = "InvalidDisplayOrderError";
  }
}

export class InvalidMenuItemNameError extends DomainError {
  constructor() {
    super("Menu item name cannot be empty");
    this.name = "InvalidMenuItemNameError";
  }
}

export class InvalidPriceError extends DomainError {
  constructor() {
    super("Price cannot be negative");
    this.name = "InvalidPriceError";
  }
}

export class CategoryMismatchError extends DomainError {
  constructor() {
    super("Category does not belong to this restaurant");
    this.name = "CategoryMismatchError";
  }
}

export class InvalidRestaurantNameError extends DomainError {
  constructor() {
    super("Restaurant name cannot be empty");
    this.name = "InvalidRestaurantNameError";
  }
}

export class InvalidSlugError extends DomainError {
  constructor() {
    super("Slug must be lowercase letters, numbers, and hyphens only");
    this.name = "InvalidSlugError";
  }
}

export class InvalidTagNameError extends DomainError {
  constructor() {
    super("Tag name cannot be empty");
    this.name = "InvalidTagNameError";
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends DomainError {
  constructor() {
    super("You do not have access to this resource");
    this.name = "UnauthorizedError";
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    // Deliberately generic — no "wrong password" vs "no such user" distinction,
    // avoids user enumeration and matches the "never expose internal errors" rule.
    super("Invalid email or password");
    this.name = "InvalidCredentialsError";
  }
}
