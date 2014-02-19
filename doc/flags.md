## Game state flags

#### WORK IN PROGRESS (incomplete)

Game state flags are used to indicate a temporary state of the player or the game, like a window is open or the player is moving. Flags are destroyed when the player leaves the game and are not intended to be saved permanently. Because they are not saved, flags that must go into effect when a game begins must be instantiated manually.

### API

Flags are stored as individual strings whose contents indicate what game state it's representing. The presence of a flag has the same meaning as the boolean `true`, and the absence of a flag has the same meaning as the boolean `false`. Any number of flags can be set at a given time. It is not possible to assign values to flags, since it is not intended to be an all-purpose data storage mechanism.

Flags can be set, removed, or checked via methods on the `$game` object:

- **$game.setFlag(_flag_)** Sets a `flag` string (which makes it `true`). If a flag is already set, this function will refuse to set it a second time (but will not remove it) and returns `false`, otherwise it will set the flag and return `true`. _Note: the method `flag()` is an alias for `setFlag()`._
- **$game.removeFlag(_flag_)** Removes a `flag` string (which makes it `false`). _Note that not providing an argument clears all the flags in the game. This is not recommended and currently nothing in the game script takes advantage of this functionality and it may be removed eventually._
- **$game.checkFlag(_flag_)** Returns whether a `flag` is `true` or `false`.

It is not possible to set, remove, or check multiple flags at once at this time. You'll need to call the methods individually for each flag you want to perform any actions on.

### Available flags

The following table documents flags that are currently set in CivicSeed.

| Flag          | Description   |
| ------------- | ------------- |
| `in-transit`  | Player is currently moving from one screen to another. Movement and input should be disabled during this time.|
| `viewing-inventory` | Player was viewing the inventory, but it had been temporarily closed for another action (e.g. reviewing the contents of a resource).|
| `npc-chatting` | Set when an NPC is communicating with the player.|
| `first-time`   | Set a player has joined the game for the first time. (New account.)|
| `solving-puzzle` | The player is currently attempting to solve the botanist's tangram puzzle.|
