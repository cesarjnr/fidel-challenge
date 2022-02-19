export class Offer {
  id!: string;
  name!: string;
  brandId!: string;
  locationsTotal!: number;

  public constructor(id: string, name: string, brandId: string, locationsTotal: number) {
    this.id = id;
    this.name = name;
    this.brandId = brandId;
    this.locationsTotal = locationsTotal;
  }
}
