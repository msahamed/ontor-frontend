// Compatibility shim — founder alerts live in lib/founder-alerts.ts.
// New code should import notifyFounderStep from @/lib/founder-alerts.
export {
  notifyFounderStep,
  sendClaimedOwnerMilestone,
  founderContextFromWebsiteProps,
  type FounderStep,
  type FounderStepContext,
  type OwnerLifecycleMilestone,
} from "@/lib/founder-alerts";
