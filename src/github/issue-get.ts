import {FromSchema} from 'json-schema-to-ts'
import {buildValidator} from '../common/validater'
import {fetchGitHubGraphQL} from './common'

const IssueSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      additionalProperties: false,
      required: ['organization'],
      properties: {
        organization: {
          type: 'object',
          additionalProperties: false,
          required: ['repository'],
          properties: {
            repository: {
              type: 'object',
              additionalProperties: false,
              required: ['issue'],
              properties: {
                issue: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['id', 'body', 'labels'],
                  properties: {
                    id: {type: 'string'},
                    body: {type: 'string'},
                    labels: {
                      type: 'object',
                      additionalProperties: false,
                      required: ['nodes'],
                      properties: {
                        nodes: {
                          type: 'array',
                          items: {
                            type: 'object',
                            additionalProperties: false,
                            required: ['id', 'name'],
                            properties: {
                              id: {type: 'string'},
                              name: {type: 'string'}
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
} as const

interface Args {
  repoOwner: string
  repoName: string
  issueNumber: number
}

export const getIssue = async (
  args: Args
): Promise<FromSchema<typeof IssueSchema>> => {
  const result = await fetchGitHubGraphQL(
    `query ($repoOwner: String!, $repoName: String!, $issueNumber: Int!) {
      organization(login: $repoOwner) {
        repository(name: $repoName) {
          issue(number: $issueNumber) {
            id
            body
            labels(first: 100) {
              nodes {
                id
                name
              }
            }
          }
        }
      }
    }`,
    {...args}
  )
  return buildValidator(IssueSchema)(result)
}
