I'd start the review from the [SchedulerService](https://github.com/Eric-Tyrrell22/ProsperHealth/blob/main/src/starter-code/schedulerService.ts)

# Task 1

## Assumptions

- follow ups don't care about the time of day the initial appointment was made.
- consumers know what type of appointment they need to find. If they don't they could just get both AssessmentAvailability and TherapyAvailability
- patients and clients are in the same timezone (utc).

## Discussion

I took a bit of liberty with the assessment type. Having the follow ups on the initial assessment makes it easier to use on the frontend IMO.

I think there's a strong argument that the frontend should just make a request for followups after a user's chosen their initial assessment date.
This would avoid stale assessments a bit. Even better, you could have the calendar open a websocket (or SSE) and subscribe to a clinician's availability.
Whether that's worth doing depends on how how many writes / updates you're dealing with, and how frequently a user selects a slot that was previously taken 
or deleted.

I'm unsure if `#getAssessmentFollowUps` required a cache since I didn't load test the function.
It obviously makes the function more verbose and difficult to follow. If I took more time, I'd do a proper test to see at what point the no-cache solution falls over.

The SQL version of this is probably a lot more elegant, depending on the schema used.

# Task 2

## Discussion

I'm fairly certain the greedy approach here is optimal. 

if appointment1 starts before appointment 2, and appointment 2 finishes before appointment3, then so does appointment 1. Therefore it always makes sense to pick the first availabile slot.

# Task 3

## Discussion

Not too much to add. biggest issue I ran into was testing where the generated appointments weren't being generated offset from the start of the week, so they were in different weeks.

If I were to spend more time, I'd want to move as much of the logic to SQL as possible, and also improve the tests with a better fake factory for all the types. 
