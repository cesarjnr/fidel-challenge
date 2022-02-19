import * as offersRepository from './offersRepository';
import * as locationsRepository from '../locations/locationsRepository';
import { Offer } from './offersEntity';
import { Location } from '../locations/locationsEntity';
import { EntityNotFoundError, ConflictError } from '../errors';
import { transactPersist } from '../utils/entityManager';

export const listOffers = async (): Promise<Offer[]> => {
  return await offersRepository.index();
}

export const linkLocationToOffer = async (offerId: string, locationId: string): Promise<void> => {
  const offer = await findOffer(offerId);
  const location = await findLocation(locationId);

  if (location.hasOffer) {
    throw new ConflictError('Location already has an offer');
  }

  const updatedLocation: Location = Object.assign(
    location,
    { offerId, hasOffer: 1 }
  );
  const updatedOffer: Offer = Object.assign(
    offer,
    { locationsTotal: ++offer.locationsTotal }
  );

  await transactPersist([updatedLocation, updatedOffer]);
}

export const linkAllBrandLocationsToOffer = async (offerId: string, brandId: string): Promise<void> => {
  const offer = await findOffer(offerId);
  const locations = await locationsRepository.getByBrandId(brandId, false);

  if (locations.length) {
    const updatedLocations = locations.map((location) => Object.assign(
      location,
      {
        offerId: offer.id,
        hasOffer: 1
      }
    ));
    
    await persistTransactionsInBatches(updatedLocations, offer);
  }
}

const findOffer = async (offerId: string): Promise<Offer> => {
  const offer = await offersRepository.findById(offerId);

  if (!offer) {
    throw new EntityNotFoundError('Offer not found');
  }

  return offer;
}

const findLocation = async (locationId: string): Promise<Location> => {
  const location = await locationsRepository.findById(locationId);

  if (!location) {
    throw new EntityNotFoundError('Location not found');
  }

  return location;
}

const persistTransactionsInBatches = async (locations: Location[], offer: Offer): Promise<void> => {
  let batchForTransaction: (Offer | Location)[] = [];
  let offerLocationsTotal = offer.locationsTotal;

  for (const [index, location] of locations.entries()) {
    if (batchForTransaction.length < 24) {
      batchForTransaction.push(location);
    }
    
    if (batchForTransaction.length === 24 || !locations[index + 1]) {
      offerLocationsTotal += batchForTransaction.length;

      const updatedOffer = {
        ...offer,
        locationsTotal: offerLocationsTotal
      };

      batchForTransaction.push(updatedOffer);

      await transactPersist(batchForTransaction);

      batchForTransaction = [];
    }
  }
};
