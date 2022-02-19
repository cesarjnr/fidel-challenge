# Fidel Coding Challenge

## About this challenge

This challenge focuses on RESTful API and data model design. It consists of 2 mandatory parts, plus an optional bonus task.
If you can't complete the bonus task, it's expected that you deliver a text explaining how you would solve the bonus task and how it fits into the solution you implemented, as well as be able to discuss it during the test review session.
We recommend that you write up a few short paragraphs explaining the decisions you made during the implementation of your solution, as well as what you would have done differently if it was meant to be a production-ready project.
Any questions you may have please contact us at backend-review@fidel.uk.

## Context

This test's main goal is to create a simplified version of the Offers API platform which allows customer's to connect brands (ex: Starbucks) with offers.
_Example: Add 5% cashback offer to Starbucks Oxford street location_
Feel free to browse our docs to familiarise yourself with our current [commercial offering](https://docs.fidel.uk/offers).
**The solution must be written in Javascript or Typescript, deployable, testable and use the following tecnhologies:**

- AWS platform,
- Lambda,
- DynamoDB.

You should take into consideration high request volume to the API and handle concurrency.
We suggest that you use Serverless Framework and API Gateway.

## Part 1

Create a DynamoDB data model and insert the following simplified data into it:

Offers

```
[{
  name: "Super Duper Offer",
  id: "d9b1d9ff-543e-47c7-895f-87f71dcad91b",
  brandId: "692126c8-6e72-4ad7-8a73-25fc2f1f56e4",
  locationsTotal: 0
}]
```

---

Locations

```
[{
  id: "03665f6d-27e2-4e69-aa9b-5b39d03e5f59",
  address: "Address 1",
  brandId: "692126c8-6e72-4ad7-8a73-25fc2f1f56e4"
  hasOffer: false
}, {
  id: "706ef281-e00f-4288-9a84-973aeb29636e",
  address: "Address 2",
  brandId: "692126c8-6e72-4ad7-8a73-25fc2f1f56e4"
  hasOffer: false
}, {
  id: "1c7a27de-4bbd-4d63-a5ec-2eae5a0f1870",
  address: "Address 3",
  brandId: "692126c8-6e72-4ad7-8a73-25fc2f1f56e4"
  hasOffer: false
}]
```

### Questions

1. Have you ever used DynamoDb before?
   - If not, how did you prepare for this task?
   - If yes, which patterns did you learn in the past that you used here?
2. How did you design your data model?
3. What are the pros and cons of Dynamodb for an API request?

### Answers

1. Yes I've used it before. Which kind of patterns are we talking about here?
2. For the `Offer` entity I set the field `id` as the partition key and didn't set any GSI. For the `Location` entity I set the field `id` as the partition key and set a GSI with the field `brandId` as the partition key and the field `hasOffer` as the sort key. Also, since we can't have a boolean field as a key for a GSI, I set the field `hasOffer` to be an integer instead of a boolean. So, in the code, I handle this field as a boolean property in the model and make the conversion from/to integer in the repository layer.
3. Because Dynamodb can automatically replicates our data across different zones we have low-latency requests. On the other hand, if the requests need to make complex queries, by passing down a lot of filters, Dynamodb is not a good choice because it limits how complex our queries can be. We can only have string, number or binary fields indexed and we cannot use some useful operators like the IN operator.

## Part 2

Create a Lambda function with an API endpoint that allows to link a location to an offer. The lambda should also increase the counter in the offer and mark the location with `hasOffer: true`.

### Questions

1. Have you used Functions as a Service (FaaS) like AWS Lambda in the past?
   - If not, how did you prepare for this task?
   - If yes, how did this task compare to what you did?
2. How do you write operations within a concurrent architecture (parallel requests, series of async actions, async mapReduce patterns, etc.)?

### Answers

1. Yes. I've designed some API endpoints that used Faas but most of the time the lambdas I've worked on were triggered by another AWS services like SQS, SNS, Schedule, MSK, etc.
2. Since I'm using the Dynamodb transaction feature, we wouldn't have problems like race conditions, so we can handle concurrent requests. The only problem is that I didn't have time to write some retry handler (in a Dynamodb transaction, if other threads/processes are trying to write in the row at the same time as the transaction occurs, then the transaction fails). I also didn't have time to implement the atomic counter feature for the generic function that handles the transactions for all entities. The atomic counter feature would be used to avoid data inconsistency (as it's necessary to get the data in the database again in order to assure the transaction is using the most up-to-date value).

## Bonus part

Consider a brand like Starbucks that has more than 10000 locations, create a Lambda function that allows to link all the brand's locations to an offer.

### Questions

If you cannot complete this part, please include a small text detailing your proposed solution, as well as the answers to the following questions:

1. What challenges do you foresee/have experienced for this part?
2. How would you handle operations that might take too long to complete (minutes instead of the typical endpoint ms range)?
3. If something fails in the middle of this long operation, how would you handle the error and notify the client?

### Answers

1. Make the entire operation consistent is the hard part because we need to involve the write part in a transaction but when using Dynamodb we have a limit of 25 write actions in a single transaction. So, in a production-ready environment I would need to handle this limit in memory.
2. I would implement an event-driven endpoint along with a background job. So, as soon as the request gets in the lambda publishes on a queue passing the `offerId` and the `brandId` values. Then we would have another service consuming that queue in order to make the persistence and notify the client in the end of it.
3. We could have some retry policy and a dead letter queue (DLQ). If the defined number of retries is achieved, we could notify the client about the error by publishing on another queue and make it available for the clients.
