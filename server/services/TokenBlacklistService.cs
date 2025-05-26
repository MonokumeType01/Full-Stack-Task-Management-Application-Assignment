using System.Collections.Concurrent;

namespace TaskManagementApp.Services;

public class TokenBlacklistService
{
    private readonly ConcurrentDictionary<string, DateTime> _blacklistedTokens = new();

    public void BlacklistToken(string token)
    {
        _blacklistedTokens[token] = DateTime.UtcNow;
    }

    public bool IsTokenBlacklisted(string token)
    {
        return _blacklistedTokens.ContainsKey(token);
    }
}
