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

# Task 2

## Discussion

I'm fairly certain the greedy approach here is optimal. 

if appointment1 starts before appointment 2, and appointment 2 finishes before appointment3, then so does appointment 1. Therefore it always makes sense to pick the first availabile slot.
