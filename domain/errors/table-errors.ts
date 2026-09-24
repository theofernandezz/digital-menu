import { DomainError } from "@/domain/errors/domain-errors";

export class InvalidTableNumberError extends DomainError {
  constructor() {
    super("Table number must be an integer between 1 and 999");
    this.name = "InvalidTableNumberError";
  }
}

export class AlreadyOpenError extends DomainError {
  constructor() {
    super("Table already has an open session");
    this.name = "AlreadyOpenError";
  }
}

export class DuplicateTableNumberError extends DomainError {
  constructor() {
    super("A table with that number already exists in this restaurant");
    this.name = "DuplicateTableNumberError";
  }
}
