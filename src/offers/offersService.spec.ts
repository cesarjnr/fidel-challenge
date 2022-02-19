import * as faker from 'faker';

import * as offersRepository from './offersRepository';
import * as locationsRepository from '../locations/locationsRepository';
import * as entityManager from '../utils/entityManager';
import * as offersService from './offersService';
import { Offer } from './offersEntity';
import { Location } from '../locations/locationsEntity';
import { EntityNotFoundError, ConflictError } from '../errors';

jest.mock('./offersRepository');
jest.mock('../locations/locationsRepository');
jest.mock('../utils/entityManager');

describe('offersService', () => {
  const mockOffersRepository = offersRepository as jest.Mocked<typeof offersRepository>;
  const mockLocationsRepository = locationsRepository as jest.Mocked<typeof locationsRepository>;
  const mockEntityManager = entityManager as jest.Mocked<typeof entityManager>;

  describe('listOffers', () => {
    it('Should list offers', async () => {
      const offers = [
        new Offer(
          faker.datatype.uuid(),
          faker.random.words(5),
          faker.datatype.uuid(),
          faker.datatype.number(100)
        )
      ];

      mockOffersRepository.index.mockResolvedValue(offers);

      const offersList = await offersService.listOffers();

      expect(offersList).toHaveLength(1);
      expect(offersList[0]).toBeInstanceOf(Offer);
      expect(mockOffersRepository.index).toHaveBeenCalled();
    });
  });

  describe('linkLocationToOffer', () => {
    const offerId = faker.datatype.uuid();
    const locationId = faker.datatype.uuid();

    it('Should throw the EntityNotFoundError exception if no offer is found for the given id', async () => {
      const mockThrownError = new EntityNotFoundError('Offer not found');
      
      await expect(offersService.linkLocationToOffer(offerId, locationId))
        .rejects
        .toStrictEqual(mockThrownError);
      expect(mockOffersRepository.findById).toHaveBeenCalledWith(offerId);
      expect(mockLocationsRepository.findById).not.toHaveBeenCalled();
      expect(mockEntityManager.transactPersist).not.toHaveBeenCalled();
    });

    it('Should throw the EntityNotFoundError exception if no location is found for the given id', async () => {
      const mockThrownError = new EntityNotFoundError('Location not found');
      const offer = new Offer(
        faker.datatype.uuid(),
        faker.random.words(5),
        faker.datatype.uuid(),
        faker.datatype.number(100)
      );

      mockOffersRepository.findById.mockResolvedValue(offer);
      
      await expect(offersService.linkLocationToOffer(offerId, locationId))
        .rejects
        .toStrictEqual(mockThrownError);
      expect(mockOffersRepository.findById).toHaveBeenCalledWith(offerId);
      expect(mockLocationsRepository.findById).toHaveBeenCalledWith(locationId);
      expect(mockEntityManager.transactPersist).not.toHaveBeenCalled();
    });

    it('Should throw the ConclictError exception if the found location already has an offer attached to it', async () => {
      const mockThrownError = new ConflictError('Location already has an offer');
      const offer = new Offer(
        faker.datatype.uuid(),
        faker.random.words(5),
        faker.datatype.uuid(),
        faker.datatype.number(100)
      );
      const location = new Location(
        faker.datatype.uuid(),
        faker.address.streetAddress(),
        faker.datatype.uuid(),
        1,
        faker.datatype.uuid()
      );

      mockOffersRepository.findById.mockResolvedValue(offer);
      mockLocationsRepository.findById.mockResolvedValue(location);
      
      await expect(offersService.linkLocationToOffer(offerId, locationId))
        .rejects
        .toStrictEqual(mockThrownError);
      expect(mockOffersRepository.findById).toHaveBeenCalledWith(offerId);
      expect(mockLocationsRepository.findById).toHaveBeenCalledWith(locationId);
      expect(mockEntityManager.transactPersist).not.toHaveBeenCalled();
    });

    it('Should link a location to an offer', async () => {
      const offer = new Offer(
        faker.datatype.uuid(),
        faker.random.words(5),
        faker.datatype.uuid(),
        faker.datatype.number(100)
      );
      const location = new Location(
        faker.datatype.uuid(),
        faker.address.streetAddress(),
        faker.datatype.uuid(),
        0
      );

      mockOffersRepository.findById.mockResolvedValue(offer);
      mockLocationsRepository.findById.mockResolvedValue(location);

      await offersService.linkLocationToOffer(offerId, locationId);

      expect(mockOffersRepository.findById).toHaveBeenCalledWith(offerId);
      expect(mockLocationsRepository.findById).toHaveBeenCalledWith(locationId);
      expect(mockEntityManager.transactPersist).toHaveBeenCalledWith([
        { ...location, offerId, hasOffer: 1 },
        offer
      ]);
    });
  });

  describe('linkAllBrandLocationsToOffer', () => {
    const offerId = faker.datatype.uuid();
    const brandId = faker.datatype.uuid();

    const generateLocations = (quantity: number): Location[] => {
      const locations: Location[] = [];

      for (let index = 0; index < quantity; index++) {
        locations.push(new Location(
          faker.datatype.uuid(),
          faker.address.streetAddress(),
          faker.datatype.uuid(),
          0
        ));
      }

      return locations;
    }

    it('Should throw the EntityNotFoundError exception if no offer is found for the given id', async () => {
      const mockThrownError = new EntityNotFoundError('Offer not found');

      mockOffersRepository.findById.mockResolvedValue(undefined);
      
      await expect(offersService.linkAllBrandLocationsToOffer(offerId, brandId))
        .rejects
        .toStrictEqual(mockThrownError);
      expect(mockOffersRepository.findById).toHaveBeenCalledWith(offerId);
      expect(mockLocationsRepository.getByBrandId).not.toHaveBeenCalled();
      expect(mockEntityManager.transactPersist).not.toHaveBeenCalled();
    });

    it('Should not link any locations to the offer if no locations is found for the given brand id', async () => {
      const offer = new Offer(
        faker.datatype.uuid(),
        faker.random.words(5),
        faker.datatype.uuid(),
        faker.datatype.number(100)
      );
      const locations: Location[] = [];

      mockOffersRepository.findById.mockResolvedValue(offer);
      mockLocationsRepository.getByBrandId.mockResolvedValue(locations);

      await offersService.linkAllBrandLocationsToOffer(offerId, brandId);

      expect(mockOffersRepository.findById).toHaveBeenCalledWith(offerId);
      expect(mockLocationsRepository.getByBrandId).toHaveBeenCalledWith(brandId, false);
      expect(mockEntityManager.transactPersist).not.toHaveBeenCalled();
    });

    it('Should link 80 locations to an offer', async () => {
      const offer = new Offer(
        faker.datatype.uuid(),
        faker.random.words(5),
        faker.datatype.uuid(),
        20
      );
      const locations = generateLocations(80);

      mockOffersRepository.findById.mockResolvedValue(offer);
      mockLocationsRepository.getByBrandId.mockResolvedValue(locations);

      await offersService.linkAllBrandLocationsToOffer(offerId, brandId);

      const firstBatch = [
        ...locations.slice(0, 24),
        { ...offer, locationsTotal: 44 }
      ];
      const secondBatch = [
        ...locations.slice(24, 48),
        { ...offer, locationsTotal: 68 }
      ];
      const thirdBatch = [
        ...locations.slice(48, 72),
        { ...offer, locationsTotal: 92 }
      ];
      const fourthBatch = [
        ...locations.slice(72, 80),
        { ...offer, locationsTotal: 100 }
      ];

      expect(mockOffersRepository.findById).toHaveBeenCalledWith(offerId);
      expect(mockLocationsRepository.getByBrandId).toHaveBeenCalledWith(brandId, false);
      expect(mockEntityManager.transactPersist).toHaveBeenCalledTimes(4);
      expect(mockEntityManager.transactPersist).toHaveBeenNthCalledWith(1, firstBatch);
      expect(mockEntityManager.transactPersist).toHaveBeenNthCalledWith(2, secondBatch);
      expect(mockEntityManager.transactPersist).toHaveBeenNthCalledWith(3, thirdBatch);
      expect(mockEntityManager.transactPersist).toHaveBeenNthCalledWith(4, fourthBatch);
    });

    it('Shuld link 20 locations to an offer', async () => {
      const offer = new Offer(
        faker.datatype.uuid(),
        faker.random.words(5),
        faker.datatype.uuid(),
        20
      );
      const locations = generateLocations(20);

      mockOffersRepository.findById.mockResolvedValue(offer);
      mockLocationsRepository.getByBrandId.mockResolvedValue(locations);

      await offersService.linkAllBrandLocationsToOffer(offerId, brandId);

      const firstBatch = [
        ...locations,
        { ...offer, locationsTotal: 40 }
      ]

      expect(mockOffersRepository.findById).toHaveBeenCalledWith(offerId);
      expect(mockLocationsRepository.getByBrandId).toHaveBeenCalledWith(brandId, false);
      expect(mockEntityManager.transactPersist).toHaveBeenCalledTimes(1);
      expect(mockEntityManager.transactPersist).toHaveBeenNthCalledWith(
        1,
        firstBatch
      );
    });
  });
});
