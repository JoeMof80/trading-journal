import Image from "next/image";

const sections = [
  {
    timeframe: "Monthly",
    steps: [
      {
        id: "1",
        title:
          "Long consolidation, strong short impulse, long momentum. Trendlines and resistance zones.",
        image: "1.png",
      },
    ],
  },
  {
    timeframe: "Weekly",
    steps: [
      {
        id: "2",
        title: "Note upside trend on both monthly and weekly TFs.",
        image: "2.png",
      },
    ],
  },
  {
    timeframe: "Daily",
    steps: [
      {
        id: "3a",
        title:
          "Note a large impulsive wave that may or may have not have ended. We don't know if the long momentum will continue.",
        image: "3a.png",
      },
      {
        id: "3b",
        title:
          "When price action does reverse, the daily wave structure will have been broken.",
        image: "3b.png",
      },
      {
        id: "3c",
        title:
          "Note area of interest around .618 level where there is also support (confluence).",
        image: "3c.png",
      },
      {
        id: "4",
        title:
          "If we bounce off the .618, it's not interesting because of the large past resistance zone. The impulse is likely to fail and higher highs are improbable because of the large rejection zone.",
        image: "4.png",
      },
      {
        id: "5",
        title:
          "If the impulse does fail, consider the .618 level just below prior pivots and the support zone.",
        image: "5.png",
      },
    ],
  },
  {
    timeframe: "Weekly",
    steps: [
      {
        id: "6",
        title:
          "Note the pivot is at the .618 level of the weekly fib (also demand zone).",
        image: "6.png",
      },
      {
        id: "7",
        title:
          "Note another pivot just below and another further down. When the prices turn around, take profits before they are hit.",
        image: "7.png",
      },
      {
        id: "8",
        title: "Because these areas are where corrections are likely.",
        image: "8.png",
      },
      {
        id: "9",
        title:
          "These are levels that have been rejected multiple times in the past (apart from 2008).",
        image: "9.png",
      },
      {
        id: "10",
        title:
          "If we see conclusive indications that we are rejecting this area and start breaking to the downside through these weekly and daily trendlines, we can expect a big move to the downside like in the past.",
        image: "10.png",
      },
      {
        id: "11",
        title: null,
        image: "11.png",
      },
    ],
  },
  {
    timeframe: "4 Hour",
    steps: [
      {
        id: "12",
        title: "We need to wait for a valid 4 hour fib setup.",
        image: "12.png",
      },
      {
        id: "13",
        title: "Or a new structure to breakdown to give a potential 1hr entry.",
        image: "13.png",
      },
    ],
  },
];

export default function EurAudGuide() {
  return (
    <div className="max-w-7xl mx-auto p-10 space-y-10">
      <h1 className="text-2xl font-bold">EUR/AUD Long Trade Guide</h1>

      {sections.map((section, i) => (
        <div key={i} className="space-y-8">
          <h2 className="text-xl font-semibold border-b pb-2">
            {section.timeframe}
          </h2>
          {section.steps.map((step) => (
            <div key={step.id} className="space-y-3">
              {step.title && <p>{step.title}</p>}
              <Image
                src={`/images/${step.image}`}
                alt={`Step ${step.id}`}
                width={1456}
                height={816}
                className="w-full rounded border"
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
