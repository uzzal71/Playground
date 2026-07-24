
local typedefs = require "kong.db.schema.typedefs"

return {
  name = "jwt-verifier",
  fields = {
    { consumer = typedefs.no_consumer },
    { protocols = typedefs.protocols_http },
    { config = {
        type = "record",
        fields = {
          { jwks_url = {
              type = "string",
              required = true,
              default = "http://auth-service:3001/.well-known/jwks.json",
          }},
          { required_iss = {
              type = "string",
              required = false,
              default = "medicine-ecommerce-auth",
          }},
          { required_role = {
              type = "array",
              elements = { type = "string", one_of = { "customer", "seller", "rider", "admin" } },
              required = false,
          }},
          { cache_ttl = {
              type = "number",
              required = false,
              default = 3600,
          }},
          { algorithm = {
              type = "string",
              required = false,
              default = "RS256",
              one_of = { "RS256", "RS384", "RS512", "HS256", "HS384", "HS512" },
          }},
        },
      },
    },
  },
}
