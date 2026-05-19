import type { Aggregate, Model, Query } from "mongoose";

import {
  Action,
  Agent,
  Assistant,
  Balance,
  Banner,
  ConversationTag,
  Conversation,
  File,
  Key,
  Message,
  PluginAuth,
  Preset,
  PromptGroup,
  Prompt,
  Session,
  SharedLink,
  Token,
  ToolCall,
  Transaction,
  User,
} from "../models/index.js";

// Schema-level pre-hooks that prepend / merge a tenantId filter into
// every aggregate, find* and count* query. Only installed when the
// TENANT_ID env is set; otherwise the exporter behaves identically to
// pre-tenant code.
//
// Caveat: Model.estimatedDocumentCount() is an O(1) collection metadata
// call that does not accept a filter, so it stays tenant-blind. The
// exporter uses it in exactly one place (total conversation count).
export function installTenantHooks(tenantId: string): void {
  const match = { tenantId };
  const models: Model<unknown>[] = [
    Action,
    Agent,
    Assistant,
    Balance,
    Banner,
    ConversationTag,
    Conversation,
    File,
    Key,
    Message,
    PluginAuth,
    Preset,
    PromptGroup,
    Prompt,
    Session,
    SharedLink,
    Token,
    ToolCall,
    Transaction,
    User,
  ] as Model<unknown>[];

  for (const model of models) {
    model.schema.pre("aggregate", function (this: Aggregate<unknown>) {
      this.pipeline().unshift({ $match: match });
    });
    model.schema.pre(/^find/, function (this: Query<unknown, unknown>) {
      this.where(match);
    });
    model.schema.pre(/^count/, function (this: Query<unknown, unknown>) {
      this.where(match);
    });
  }
}
