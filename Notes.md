## Considerations

1. Since we'll need to allow users to link more than one location to an offer by the location brand, a GSI was created where `brandId` is the partition key and `hasOffer` is the sort key. When we query the locations table using this index, the `brandId` value will be the one received in the request and the `hasOffer` value will be `false` since we need to get all the locations that haven't already been linked to an offer.
2. For the action of linking location(s) to an offer, transaction operations were used to update both locations and offer since we cannot persist the properties `offerId` and `hasOffer` for the Location entity without persisting the property `locationTotals` for the Offer entity as well. Also, Dynamodb has a limit of 25 items per transaction so it was necessary to handle this in memory by sending the transactions in batches.

## Endpoints

1. List Locations - `https://pz0ys9ylz7.execute-api.sa-east-1.amazonaws.com/locations`
2. List Offers - `https://pz0ys9ylz7.execute-api.sa-east-1.amazonaws.com/offers`
3. Link Location to Offer - `https://pz0ys9ylz7.execute-api.sa-east-1.amazonaws.com/offers/{offerId}/locations/{locationId}`
4. Link All Brand Locations to Offer - `https://pz0ys9ylz7.execute-api.sa-east-1.amazonaws.com/offers/{offerId}/brands/{brandId}`