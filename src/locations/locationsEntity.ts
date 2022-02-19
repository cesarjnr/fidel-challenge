export class Location {
  id!: string;
  address!: string;
  brandId!: string;
  hasOffer!: number;
  offerId?: string;

  public constructor(
    id: string,
    address: string,
    brandId: string,
    hasOffer: number,
    offerId?: string
  ) {
    this.id = id;
    this.address = address;
    this.brandId = brandId;
    this.hasOffer = hasOffer;
    this.offerId = offerId;
  } 
}
