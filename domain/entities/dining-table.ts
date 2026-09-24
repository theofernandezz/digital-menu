import { InvalidTableNumberError } from "@/domain/errors/table-errors";

export const MIN_TABLE_NUMBER = 1;
export const MAX_TABLE_NUMBER = 999;

export type DiningTableProps = {
  id: string;
  restaurantId: string;
  tableNumber: number;
  qrToken: string;
  isOpen: boolean;
};

export class DiningTable {
  private constructor(private readonly props: DiningTableProps) {}

  static create(props: DiningTableProps): DiningTable {
    if (
      !Number.isInteger(props.tableNumber) ||
      props.tableNumber < MIN_TABLE_NUMBER ||
      props.tableNumber > MAX_TABLE_NUMBER
    ) {
      throw new InvalidTableNumberError();
    }
    return new DiningTable(props);
  }

  get id(): string {
    return this.props.id;
  }

  get restaurantId(): string {
    return this.props.restaurantId;
  }

  get tableNumber(): number {
    return this.props.tableNumber;
  }

  get qrToken(): string {
    return this.props.qrToken;
  }

  get isOpen(): boolean {
    return this.props.isOpen;
  }
}
