# Tracking plan

Rule: an event with no decision attached is a line on a bill.

| Event | Where | Question it answers | Decision it informs |
| --- | --- | --- | --- |
| landing_cta_clicked | client, / | Does the landing page convert, and from which source? | Rewrite the landing page or change channels |
| user_signed_up (+ identify) | server, first profile | Who signs up, with which stack, from where? | Which audiences to build for |
| search_performed | client, /explore | What do people want, and what returns nothing? | Which skills to seed or commission |
| search_result_opened | client, /explore | Is ranking putting good results first? | Change search ranking |
| skill_viewed | client, /s/[slug] | Which skills attract attention? | What to feature |
| share_link_opened | client, /s/[slug] | Does sharing bring people in? | Invest in the referral loop |
| skill_installed | server, /s/[slug] | Do people get value? (consumer value event) | Our north-star input |
| skill_starred, comment_posted | server, /s/[slug] | Who engages socially and returns? | Invest in community features |
| skill_forked | server, /s/[slug] | Do people engage deeply? | Invest in remixing features |
| publish_started, skill_published | client / server, /publish | Where do builders give up? (builder activation) | Fix the publish flow |
| notification_clicked | server, /dashboard | Do notifications bring people back? | Keep or change notifications |
| organization_created | server, webhook | Do teams adopt Hive? | Invest in team features |
| paywall_shown | client, /publish | How many people want a paid feature? | Price and position Pro and Team |
| pricing_viewed | client, /pricing | Do people who hit the paywall look at plans? | Fix the upgrade path |
| subscription_started, subscription_canceled | server, webhook | Would someone pay, and do they stay? | Keep, change or drop the paid plans |

Not tracked on purpose: follows, profile views, log-ins. No decision depends on them yet.
Groups: every event sent while a team is active is attached to that organization.
