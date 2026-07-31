/**
 * Support reading essays. Body text feeds both the reading view and the listen
 * (text-to-speech) control.
 */
export type Essay = {
  id: string;
  title: string;
  subtitle: string;
  body: string;
};

export const ESSAYS: Essay[] = [
  {
    id: "when-world-says-just-a-pet",
    title: "When the World Says It Was Just a Pet",
    subtitle: "Understanding pet loss, grief, and emotional wellbeing.",
    body: `When your dog dies, or your cat, or the small parrot who greeted you at the door, the world often does not know what to do with your grief. People will say, gently, that it was just a pet. They mean well. They are trying to shrink the loss to a size that seems manageable to them. But for you, the loss is not small.

An animal you loved was a daily presence. They were there at breakfast. They watched you cry once and did not move away. They knew the sound of your car in the driveway. That is a real relationship, and when it ends, real grief follows.

Pet grief is not a lesser grief. It has its own shape. Sometimes it is quieter, because the animal did not speak in words, so what is missing is a texture, a weight on the bed, a breathing sound in the next room.

You do not need anyone's permission to grieve your animal. You are allowed to feel this fully.`,
  },
  {
    id: "heartache-to-reflection",
    title: "From Heartache to Reflection",
    subtitle: "Journaling through the loss of a beloved pet.",
    body: `Writing after a pet dies is not about producing anything. It is a way to slow down long enough to notice what you are carrying.

Start small. One sentence about the morning. One sentence about a moment you remembered while making tea. You do not have to write about the death itself until you want to. You can write about their ears, the way they slept in a particular square of sun, the sound of their tags on the floor.

Over time, the writing becomes a place where the animal still lives. Not in a haunted way. In the way that people you have loved go on shaping your inner life long after you last saw them.

Keep the notebook nearby. Return to it when you can.`,
  },
  {
    id: "grief-that-goes-unseen",
    title: "Understanding the Grief That Often Goes Unseen",
    subtitle: "Disenfranchised grief and the weight of an unrecognized loss.",
    body: `Some griefs are widely acknowledged. Others are not. When a loss is not fully recognized by the people around you, grief researchers call it disenfranchised grief.

Pet loss often falls into this category. So does the loss of an ex, an estranged parent, a friend from long ago, a pregnancy that others did not know about. The pain is the same weight. What is missing is the social permission to grieve openly.

If your grief has felt like something you have to hide, or minimize, or explain, that is not a sign that your grief is wrong. It is a sign that the loss was not seen by people who could not see it.

You can be your own witness. You can, with time, find others who understand.`,
  },
  {
    id: "what-are-grief-apps",
    title: "What Are Grief Apps",
    subtitle: "The emerging role of digital companionship after loss.",
    body: `A grief app is not a therapist and does not try to be. It is closer to a notebook that answers you sometimes, a quiet place to put what you are feeling when it is late and the house is too still.

Good grief technology holds a few things at once. It takes your loss seriously without dramatizing it. It uses your person's or your animal's name. It does not push you toward closure, because there is no such thing.

It is a companion, in the plain sense of the word. Something that stays near you as you move through this. Not a solution. Not a treatment. A presence.

Used well, it sits alongside human support, not in place of it.`,
  },
];

export function essayById(id: string | undefined): Essay | undefined {
  return ESSAYS.find((e) => e.id === id);
}
