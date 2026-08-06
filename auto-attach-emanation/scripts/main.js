console.log("G O L I A T H  O N L I N E")

function nthIndex(string, pattern, number) {
    let length = string.length, i = -1;
    while (number-- && i++ < length) {
        i = string.indexOf(pattern, i);
        if (i < 0) break;
    }
    return i;
};

function warnTheGM(message) {
    if (game.user !== game.users.activeGM) return;
    ui.notifications.warn(message);
};


Hooks.once("ready", () => {
    game.socket.on('module.auto-attach-emanation', (message) => {
        warnTheGM(message);
    }
)});

Hooks.on("createRegion", async (...args) => {
    if (args[0].flags.dnd5e.origin) {
        const originActivity = await fromUuid(args[0].flags.dnd5e.origin);
        
        if (originActivity.target.template.labels.type == "Emanation") {
            let tokenDocument;

            // Only non-linked token documents include a "direct line" to the token document in the flags :(
            if (originActivity.uuid.includes("Token")) {
                // This could be done smarter, but we're finding the fourth period to pilfer the token document UUID from the longer activity UUID, so we know which to token document to attach to.
                const fourthPeriod = nthIndex(originActivity.uuid, ".", 4);
                tokenDocument = await fromUuid(originActivity.uuid.substring(0, fourthPeriod))
                await args[0].update({ "attachment.token": tokenDocument });

            }

            // Assume there's only 1 token of the linked character on the parent scene
            else {
                const foundLinkedTokens = args[0].parent.tokens.filter((possibleToken) => possibleToken.actorId == originActivity.actor.id)
                if (foundLinkedTokens.length == 0) {
                    game.socket.emit('module.auto-attach-emanation', `No tokens related to actor ${originActivity.actor.name} found on the scene, cannot automatically attach emanation region.`)
                    return;
                }
                if (foundLinkedTokens.length > 1) {
                    game.socket.emit('module.auto-attach-emanation', `Found more than 1 token related to actor ${originActivity.actor.name} on the scene, automatically attaching to one at random.`)
                }

                tokenDocument = args[0].parent.tokens.find((possibleToken) => possibleToken.actorId == originActivity.actor.id);
                await args[0].update({ "attachment.token": tokenDocument });
            };


        }
    }
});