import * as types from '@babel/types'

import {
  objectToObjectExpression,
  convertValueToLiteral,
} from '@teleporthq/teleport-shared/dist/cjs/utils/ast-js-utils'
import { camelCaseToDashCase } from '@teleporthq/teleport-shared/dist/cjs/utils/string-utils'
import { UIDLStateDefinition, UIDLPropDefinition } from '@teleporthq/teleport-types'

import { JSXRootReturnType } from '@teleporthq/teleport-shared/dist/cjs/node-handlers/node-to-jsx/types'

export const createClassDeclaration = (
  name: string,
  propDefinitions: Record<string, UIDLPropDefinition>,
  stateDefinitions: Record<string, UIDLStateDefinition>,
  jsxTagTree: JSXRootReturnType,
  t = types
) => {
  const returnedAST =
    typeof jsxTagTree === 'string' ? t.stringLiteral(jsxTagTree) : (jsxTagTree as types.JSXElement)

  const propDeclaration = Object.keys(propDefinitions).map((propKey) =>
    t.classProperty(
      t.identifier(propKey),
      convertValueToLiteral(propDefinitions[propKey].defaultValue),
      types.tsTypeAnnotation(getTSAnnotationForType(propDefinitions[propKey].type)),
      [t.decorator(t.callExpression(t.identifier('Prop'), []))]
    )
  )

  const stateDeclaration = Object.keys(stateDefinitions).map((stateKey) =>
    t.classProperty(
      t.identifier(stateKey),
      convertValueToLiteral(stateDefinitions[stateKey].defaultValue),
      t.tsTypeAnnotation(getTSAnnotationForType(stateDefinitions[stateKey].type)),
      [t.decorator(t.callExpression(t.identifier('State'), []))]
    )
  )

  const classBody = t.classBody([
    ...propDeclaration,
    ...stateDeclaration,
    types.classMethod(
      'method',
      t.identifier('render'),
      [],
      t.blockStatement([t.returnStatement(returnedAST)])
    ),
  ])

  const classDeclaration = t.classDeclaration(t.identifier(name), null, classBody, [])
  return t.exportNamedDeclaration(classDeclaration, [])
}

const getTSAnnotationForType = (type: any, t = types) => {
  switch (type) {
    case 'string':
      return t.tsStringKeyword()
    case 'number':
      return t.tsNumberKeyword()
    case 'boolean':
      return t.tsBooleanKeyword()
    default:
      return t.tsUnknownKeyword()
  }
}

export const createComponentDecorator = (name: string, t = types) => {
  return t.decorator(
    t.callExpression(t.identifier('Component'), [
      objectToObjectExpression({
        tag: camelCaseToDashCase(name),
        shadow: true,
      }),
    ])
  )
}