## Game state flags

#### WORK IN PROGRESS (incomplete)

Game state flags are used to indicate a temporary state of the player or the game, like a window is open or the player is moving. Flags are destroyed when the player leaves the game and are not intended to be saved permanently. Because they are not saved, flags that must go into effect when a game begins must be instantiated manually.

### API

Flags are stored as individual strings whose contents indicate what game state it's representing. The presence of a flag has the same meaning as the boolean `true`, and the absence of a flag has the same meaning as the boolean `false`. Any number of flags can be set at a given time. It is not possible to assign values to flags, since it is not intended to be an all-purpose data storage mechanism.

Flags can be set, removed, or checked via methods on the `$game` object:

- **$game.flags.set(_flag_)** Sets a `flag` string (which makes it `true`).
- **$game.flags.unset(_flag_)** Removes a `flag` string (which makes it `false`).
- **$game.flags.check(_flag_)** Returns whether a `flag` is `true` or `false`.

It is not possible to set, remove, or check multiple flags at once at this time. You'll need to call the methods individually for each flag you want to perform any actions on.

### Available flags

The following table documents flags that are currently set in CivicSeed.

| Flag          | Description   |
| ------------- | ------------- |
| `pathfinding` | Game is currently calculating a path between two points. Certain inputs should be disabled during this time. |
| `is-moving`   | Player is currently moving from one point to another. |
| `screen-transition` | Player is currently moving from one screen to another. Movement and input should be disabled during this time. |
| `viewing-inventory` | Player was using the inventory, but it had been temporarily hidden for another action (e.g. reviewing the contents of a resource).|
| `visible-inventory` | Set when the inventory overlay is currently visible on the gameboard.|
| `visible-seedventory` | Set when the seedventory overlay is currently visible.|
| `visible-help` | Set when the Help overlay is currently visible. |
| `visible-progress` | Set when the Progress overlay is currently visible.|
| `visible-skinventory` | Set when the Changing Room overlay is currently visible.|
| `visible-resource-overlay` | Set when the Resource overlay is currently visible. |
| `visible-botanist-overlay` | Set when the Botanist overlay is currently visible. |
| `visible-boss-overlay` | Set when the Boss overlay is currently visible. |
| `npc-chatting` | Set when an NPC is communicating with the player.|
| `botanist-chatting` | Set when the Botanist is communicating with the player.|
| `chatting`     | Set when a player is chatting. |
| `first-time`   | Set a player has joined the game for the first time with a new account, and has not yet completed the tutorial.|
| `solving-puzzle` | The player is currently attempting to solve the botanist's tangram puzzle.|
| `seed-mode` | The player is currently in seed mode. This can mean currently planting a seed or viewing the seed inventory.|
| `draw-mode` | The player is currently in seed draw mode. This mean currently using the seed drawing mode.|
| `awaiting-seed` | This flag is set when a seed plant request is sent to the server & removed when the server responds, throttling multiple plant requests from the player. |
| `boss-mode-ready` | The player has completed the game and is ready to play the boss level. |
| `boss-mode-unlocked` | The world color meter has hit a point where the boss mode is unlocked for all players. |
| `boss-mode` | The player is currently playing the boss level. |
| `playing-cutscene` | A cutscene is currently being played. |

#### Player skin effect flags

These are a category of flags that are set depending on outfits that the player is wearing.

| Flag          | Description   |
| ------------- | ------------- |
| `local-radar`  | NPCs on the player's screen that are holding available resources are highlighted.|
| `global-radar` | NPCs on the player's level that are holding available resources are highlighted.|
| `speed-up`     | The player walks slightly faster.|
| `speed-max`    | The player walks at maximum speed.|
| `paint-up`     | The player paints a higher radius with a seed.|
| `paint-max`    | The player paints the maximum radius with a seed.|
| `teleport-port` | The player can teleport to the Port with a special command.|
| `teleport-ranch` | The player can teleport to the Ranch with a special command.|
| `teleport-town` | The player can teleport to the Town with a special command.|
| `teleport-forest` | The player can teleport to the Forest with a special command.|
| `pledge-reward` | The player gets ten more paintbrush seeds whenever they pledge another player's response. |
