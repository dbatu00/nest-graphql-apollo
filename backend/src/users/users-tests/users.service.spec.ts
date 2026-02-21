import { UsersService } from '../users.service';
import { User } from '../user.entity';
import { Follow } from '../../follows/follow.entity';

describe('UsersService', () => {
    const userRepo = {
        findOne: jest.fn(),
    };

    const followRepo = {
        findOne: jest.fn(),
        count: jest.fn(),
    };

    let service: UsersService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new UsersService(userRepo as any, followRepo as any);
    });

    describe('findById', () => {
        it('returns user when found', async () => {
            const user = { id: 1, username: 'deniz' } as User;
            userRepo.findOne.mockResolvedValue(user);

            await expect(service.findById(1)).resolves.toBe(user);
            expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
        });

        it('returns null when user is missing', async () => {
            userRepo.findOne.mockResolvedValue(null);

            await expect(service.findById(999)).resolves.toBeNull();
        });

        it('propagates repository errors', async () => {
            userRepo.findOne.mockRejectedValue(new Error('findById failed'));

            await expect(service.findById(1)).rejects.toThrow('findById failed');
        });
    });

    describe('findByUsername', () => {
        it('queries username with posts relation ordered desc', async () => {
            const user = { id: 1, username: 'deniz', posts: [{ id: 2 }] } as any;
            userRepo.findOne.mockResolvedValue(user);

            await expect(service.findByUsername('deniz')).resolves.toBe(user);
            expect(userRepo.findOne).toHaveBeenCalledWith({
                where: { username: 'deniz' },
                relations: ['posts'],
                order: {
                    posts: {
                        createdAt: 'DESC',
                    },
                },
            });
        });

        it('returns null when username does not exist', async () => {
            userRepo.findOne.mockResolvedValue(null);

            await expect(service.findByUsername('missing')).resolves.toBeNull();
        });

        it('propagates repository errors', async () => {
            userRepo.findOne.mockRejectedValue(new Error('findByUsername failed'));

            await expect(service.findByUsername('deniz')).rejects.toThrow('findByUsername failed');
        });
    });

    describe('isFollowing', () => {
        it('returns true when follow relation exists', async () => {
            followRepo.findOne.mockResolvedValue({ id: 10 } as Follow);

            await expect(service.isFollowing(1, 2)).resolves.toBe(true);
            expect(followRepo.findOne).toHaveBeenCalledWith({
                where: {
                    follower: { id: 1 },
                    following: { id: 2 },
                },
                select: { id: true },
            });
        });

        it('returns false when follow relation does not exist', async () => {
            followRepo.findOne.mockResolvedValue(null);

            await expect(service.isFollowing(1, 2)).resolves.toBe(false);
        });

        it('propagates repository errors', async () => {
            followRepo.findOne.mockRejectedValue(new Error('isFollowing failed'));

            await expect(service.isFollowing(1, 2)).rejects.toThrow('isFollowing failed');
        });
    });

    describe('countFollowers', () => {
        it('counts followers by following user id', async () => {
            followRepo.count.mockResolvedValue(7);

            await expect(service.countFollowers(2)).resolves.toBe(7);
            expect(followRepo.count).toHaveBeenCalledWith({
                where: { following: { id: 2 } },
            });
        });

        it('propagates repository errors', async () => {
            followRepo.count.mockRejectedValue(new Error('countFollowers failed'));

            await expect(service.countFollowers(2)).rejects.toThrow('countFollowers failed');
        });
    });

    describe('countFollowing', () => {
        it('counts following by follower user id', async () => {
            followRepo.count.mockResolvedValue(4);

            await expect(service.countFollowing(3)).resolves.toBe(4);
            expect(followRepo.count).toHaveBeenCalledWith({
                where: { follower: { id: 3 } },
            });
        });

        it('propagates repository errors', async () => {
            followRepo.count.mockRejectedValue(new Error('countFollowing failed'));

            await expect(service.countFollowing(3)).rejects.toThrow('countFollowing failed');
        });
    });
});
