import { describe, expect, it } from "vitest"

import { sortActivitiesAlphabetically } from "@/lib/activities/sorting"

describe("activity title sorting", () => {
  it("sorts case-insensitively with Portuguese alphabetical rules without mutating input", () => {
    const activities = [
      { id: "z", title: "Zebra" },
      { id: "a", title: "atividade" },
      { id: "accent", title: "Árvore" },
      { id: "b", title: "Beta" },
    ]

    expect(sortActivitiesAlphabetically(activities).map((activity) => activity.id)).toEqual([
      "accent",
      "a",
      "b",
      "z",
    ])
    expect(activities.map((activity) => activity.id)).toEqual(["z", "a", "accent", "b"])
  })
})
