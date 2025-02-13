import { expect } from "chai";
import v1Gen from "uuid/v1";

import { GameSimulation } from '../../src/game/simulation/GameSimulation';
import { Player } from "../../src/game/simulation/objects/Player";
import { Bullet } from "../../src/game/simulation/objects/Bullet";
import { PlayerMoveUpdateQueue } from "../../src/public/javascript/game/data-structures/PlayerMoveUpdateQueue";
import { PlayerMoveUpdate, PlayerMoveDirection } from "../../src/public/javascript/game/models/PlayerMoveUpdate";
import { b2Vec2 } from "../../lib/box2d-physics-engine/Box2D";

describe('GameSimulation', () => {
    it('should initialize a world', () => {
        const updateQueue: PlayerMoveUpdateQueue = new PlayerMoveUpdateQueue(30, 10);
        const simulation: GameSimulation = new GameSimulation(updateQueue);
        expect(simulation).to.exist;
    });

    it('should extract a move from the queue for each player during a physics frame', () => {
        const updateQueue: PlayerMoveUpdateQueue = new PlayerMoveUpdateQueue(30, 10);
        const simulation: GameSimulation = new GameSimulation(updateQueue);
        simulation.setPlayers(["1", "2"]);
        const player1Update: PlayerMoveUpdate = new PlayerMoveUpdate("1", 0, 1, true, PlayerMoveDirection.Down, false);
        const player2Update: PlayerMoveUpdate = new PlayerMoveUpdate("2", 0, 1, true, PlayerMoveDirection.Down, false);
        updateQueue.addPlayerMoveUpdate(player1Update);
        updateQueue.addPlayerMoveUpdate(player2Update);
        simulation.nextFrame();
        simulation.nextFrame();

        expect(updateQueue.size()).to.equal(0);
    });

    it('should update the frame count after performing a physics frame', () => {
        const updateQueue: PlayerMoveUpdateQueue = new PlayerMoveUpdateQueue(30, 10);
        const simulation: GameSimulation = new GameSimulation(updateQueue);
        simulation.nextFrame();

        expect(simulation.getFrame()).to.equal(1);
    });

    describe('#addPlayer()', () => {
        it('should add a player to the simulation', function () {
            const updateQueue: PlayerMoveUpdateQueue = new PlayerMoveUpdateQueue(30, 10);
            const simulation: GameSimulation = new GameSimulation(updateQueue);

            // the size of the players list should increase by 1
            const originalSize: number = simulation.objects.size;
            simulation.setPlayers([v1Gen()]);
            const newSize: number = simulation.objects.size;
            expect(newSize).to.equal(originalSize + 1);
        });
    });

    describe('#updateMove()', () => {
        it('should apply move updates to a player', () => {
            const updateQueue: PlayerMoveUpdateQueue = new PlayerMoveUpdateQueue(30, 10);
            const simulation: GameSimulation = new GameSimulation(updateQueue);
            const id: string = v1Gen();
            simulation.setPlayers([id]);

            const player: Player = simulation.objects.get(id) as Player;

            // The player should be in its default position at first.
            let startAngle: number = player.body.GetAngle();
            let startX: number = player.body.GetPosition().x;
            let startY: number = player.body.GetPosition().y;

            // Simulate 1 second in the simulation.
            for (let i = 0; i < 30; i++) {
                const move: PlayerMoveUpdate = new PlayerMoveUpdate(id, 0, 1, true, PlayerMoveDirection.Up, false);
                updateQueue.addPlayerMoveUpdate(move);
                simulation.nextFrame();
            }

            expect(player.body.GetAngle()).to.equal(1);
            expect(player.body.GetPosition().x).to.be.closeTo(startX, 0.0001);
            expect(player.body.GetPosition().y).to.be.closeTo(startY - Player.SPEED, 0.0001);

            // Simulate another second in the simulation.
            for (let i = 0; i < 30; i++) {
                const move = new PlayerMoveUpdate(id, i + 30, 0, false, PlayerMoveDirection.UpLeft, false);
                updateQueue.addPlayerMoveUpdate(move);
                simulation.nextFrame();
            }

            expect(player.body.GetAngle()).to.equal(1);
            // -7.071067811865472 (actual) is close enough to -7.071067811865475 (expected)
            expect(player.body.GetPosition().x).to.be.closeTo(startX - Player.SPEED / Math.sqrt(2), 0.00001);
            expect(player.body.GetPosition().y).to.be.closeTo(startY - (Player.SPEED + Player.SPEED / Math.sqrt(2)), 0.00001);
        });

        it('should apply a default move if it receives no move update', () => {
            const updateQueue: PlayerMoveUpdateQueue = new PlayerMoveUpdateQueue(30, 10);
            const simulation: GameSimulation = new GameSimulation(updateQueue);
            const id: string = v1Gen();
            simulation.setPlayers([id]);
            const player: Player = simulation.objects.get(id) as Player;

            // The player is currently moving.
            player.body.SetLinearVelocity({ x: 5, y: 5 });

            // There is nothing in updateQueue.
            simulation.nextFrame();

            // A default move update should be applied, causing the player to
            // stop moving.
            const notMovingVector = new b2Vec2(0, 0);
            expect(player.body.GetLinearVelocity().x).to.equal(notMovingVector.x);
            expect(player.body.GetLinearVelocity().y).to.equal(notMovingVector.y);
        });
    });
    it("Should destroy bullet when it collides with a player", () => {
        const simulation: GameSimulation = new GameSimulation(new PlayerMoveUpdateQueue(1));
        let player: Player = new Player(simulation, "testid1");
        player.body.SetPositionXY(0, 0);
        simulation.addGameObject(player);
        let bullet: Bullet = new Bullet(simulation, "testid2", "none", -1, 0, 0);
        bullet.body.SetLinearVelocity({ x: 1, y: 0 });
        simulation.addGameObject(bullet);
        for (let i = 0; i < 100; i++) {
            simulation.nextFrame();
        }
        // console.log(simulation.objects.get("testid2"));
        expect(simulation.objects.get("testid2")).to.be.undefined;
    });
    it("Should destroy object when method called", () => {
        const simulation: GameSimulation = new GameSimulation(new PlayerMoveUpdateQueue(1));
        let bullet: Bullet = new Bullet(simulation, "testid2", "none", -1, 0, 0);
        simulation.addGameObject(bullet);
        simulation.destroyGameObject("testid2");
        expect(simulation.objects.get("testid2")).to.be.undefined;
    });
});
