import { DomainError } from "@/domain/errors/domain-errors";

// The business outcomes of placing an order, one class per `code` the customer
// UI reacts to (docs/customer-ordering.md, section 8). `code` is a stable,
// machine-readable identifier; the message is for logs, not for customers.
export class InvalidTableError extends DomainError {
  readonly code = "invalid_table";
  constructor() {
    super("Table not found");
    this.name = "InvalidTableError";
  }
}

export class TableClosedError extends DomainError {
  readonly code = "table_closed";
  constructor() {
    super("Table is not open for ordering");
    this.name = "TableClosedError";
  }
}

export class TooManyOpenOrdersError extends DomainError {
  readonly code = "too_many_open_orders";
  constructor() {
    super("Too many orders in progress for this table");
    this.name = "TooManyOpenOrdersError";
  }
}

export class ItemsUnavailableError extends DomainError {
  readonly code = "items_unavailable";
  constructor(readonly itemIds: string[]) {
    super("Some items cannot be ordered");
    this.name = "ItemsUnavailableError";
  }
}

export class InvalidItemsError extends DomainError {
  readonly code = "invalid_items";
  constructor() {
    super("The order lines are invalid");
    this.name = "InvalidItemsError";
  }
}
