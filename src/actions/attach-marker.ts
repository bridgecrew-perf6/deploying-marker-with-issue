import {Input} from '../common/input'
import {getIssue} from '../github/issue-get'
import {updateIssue} from '../github/issue-update'
import {getLabels} from '../github/label-get'
import {attachedMarkerOnIssue, LabelName} from '../common/label'
import {createLabel} from '../github/label-create'
import {onError} from '../common/error'
import {getMessage, updateIssueBody} from '../common/messages'
import {createIssueComment} from '../github/issue-comment-create'

export const attachMarker = async (input: Input): Promise<void> => {
  const {repoOwner, repoName, issueNumber, exitWithError, refLink, actor} =
    input

  const attached = await attachedMarkerOnIssue(repoOwner, repoName, issueNumber)
  if (attached) {
    if (exitWithError) {
      onError(getMessage('error:label_already_attached'))
    }
    return
  }

  const issue = await getIssue({repoOwner, repoName, issueNumber})
  const {body} = issue.data.organization.repository.issue
  const labels = (await getLabels({repoOwner, repoName, labelName: LabelName}))
    .data.organization.repository.labels.nodes
  const label = labels.find(({name}) => name === LabelName)

  let labelId = label?.id
  if (labelId == null) {
    const createLabelResult = await createLabel({
      repoOwner,
      repoName,
      labelName: LabelName
    })
    labelId = createLabelResult.node_id
  }

  const issueId = issue.data.organization.repository.issue.id
  await updateIssue({issueId, body, labelIds: [labelId]})
  const attachedMessage = getMessage('issue_comment:attached', {refLink, actor})
  const comment = await createIssueComment({issueId, body: attachedMessage})
  await updateIssue({
    issueId,
    body: updateIssueBody(body, comment.data.addComment.commentEdge.node.url),
    labelIds: [labelId]
  })
}
