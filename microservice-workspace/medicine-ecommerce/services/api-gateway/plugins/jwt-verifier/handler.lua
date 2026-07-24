

local jwt_decoder = require "kong.plugins.jwt.jwt_parser"
local http = require "resty.http"
local cjson = require "cjson.safe"

local JwtVerifierHandler = {
  PRIORITY = 1005,
  VERSION = "1.0.0",
}

local function fetch_jwks(jwks_url)
  local httpc = http.new()
  httpc:set_timeout(5000)

  local res, err = httpc:request_uri(jwks_url, {
    method = "GET",
    headers = { ["Accept"] = "application/json" },
    keepalive_timeout = 60000,
    keepalive_pool = 10,
  })

  if not res then
    kong.log.err("failed to fetch JWKS: ", err)
    return nil, err
  end

  if res.status ~= 200 then
    kong.log.err("JWKS endpoint returned status: ", res.status)
    return nil, "non-200 status"
  end

  local jwks = cjson.decode(res.body)
  return jwks
end

local function get_signing_key(jwks, kid)
  if not jwks or not jwks.keys then return nil end
  for _, key in ipairs(jwks.keys) do
    if key.kid == kid then
      return key
    end
  end
  return nil
end

function JwtVerifierHandler:access(conf)
  
  local auth_header = kong.request.get_header("Authorization")
  if not auth_header then
    return kong.response.exit(401, {
      error = "Unauthorized",
      message = "Missing Authorization header",
      request_id = kong.request.get_header("X-Request-ID"),
    })
  end

  local token = auth_header:match("^[Bb]earer%s+(.+)$")
  if not token then
    return kong.response.exit(401, {
      error = "Unauthorized",
      message = "Malformed Authorization header. Expected: Bearer <token>",
    })
  end

  
  local jwt, err = jwt_decoder:new(token)
  if err then
    return kong.response.exit(401, {
      error = "Unauthorized",
      message = "Invalid token format",
    })
  end

  
  if jwt.claims.exp and jwt.claims.exp < ngx.time() then
    return kong.response.exit(401, {
      error = "Unauthorized",
      message = "Token has expired",
    })
  end

  
  if conf.required_iss and jwt.claims.iss ~= conf.required_iss then
    return kong.response.exit(401, {
      error = "Unauthorized",
      message = "Invalid token issuer",
    })
  end

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  

  
  if not jwt.claims.sub then
    return kong.response.exit(401, {
      error = "Unauthorized",
      message = "Token missing subject claim",
    })
  end

  
  kong.service.request.set_header("X-User-ID", jwt.claims.sub)
  kong.service.request.set_header("X-User-Email", jwt.claims.email or "")
  kong.service.request.set_header("X-User-Role", jwt.claims.role or "customer")

  if jwt.claims.shop_id then
    kong.service.request.set_header("X-Shop-ID", jwt.claims.shop_id)
  end

  
  if conf.required_role then
    local user_role = jwt.claims.role or "customer"
    local allowed = false
    for _, role in ipairs(conf.required_role) do
      if role == user_role then
        allowed = true
        break
      end
    end
    if not allowed then
      return kong.response.exit(403, {
        error = "Forbidden",
        message = "Insufficient permissions for this resource",
        required_role = conf.required_role,
      })
    end
  end

  
  kong.log.info("authenticated user: ", jwt.claims.sub, " role: ", jwt.claims.role)
end

return JwtVerifierHandler
