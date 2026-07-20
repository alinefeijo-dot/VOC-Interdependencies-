const LINEAR_API = "https://api.linear.app/graphql";

export const STAGE_STATE_IDS = {
  not_reviewed: "e706d244-cfe3-4016-8f9d-602be099de00",
  reviewed_voc: "40458ef0-23d9-44c4-a8e2-0159a678b473",
  reviewed_pde: "7d36c785-a96f-4c87-8e1d-0052a89d71fa",
  on_roadmap: "7bb77fa7-5531-43f4-827b-89a736a1e73b",
};

export async function updateIssueState(issueIdentifier, stage) {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    throw new Error("LINEAR_API_KEY is not set — cannot write to Linear.");
  }
  const stateId = STAGE_STATE_IDS[stage];
  if (!stateId) {
    throw new Error(`No Linear state mapped for stage "${stage}".`);
  }

  const findQuery = `query($id: String!) { issue(id: $id) { id } }`;
  const findRes = await fetch(LINEAR_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: apiKey },
    body: JSON.stringify({ query: findQuery, variables: { id: issueIdentifier } }),
  });
  const findJson = await findRes.json();
  if (findJson.errors || !findJson.data?.issue?.id) {
    throw new Error(
      `Could not resolve Linear issue ${issueIdentifier}: ${JSON.stringify(findJson.errors ?? findJson)}`
    );
  }
  const internalId = findJson.data.issue.id;

  const mutation = `mutation($id: String!, $stateId: String!) {
    issueUpdate(id: $id, input: { stateId: $stateId }) { success }
  }`;
  const res = await fetch(LINEAR_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: apiKey },
    body: JSON.stringify({ query: mutation, variables: { id: internalId, stateId } }),
  });
  const json = await res.json();
  if (json.errors || !json.data?.issueUpdate?.success) {
    throw new Error(`Failed to update ${issueIdentifier}: ${JSON.stringify(json.errors ?? json)}`);
  }
  return true;
}
