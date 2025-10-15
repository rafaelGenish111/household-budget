const QUEUE_KEY = 'offline_requests_queue';

export const queueRequest = (request) => {
    const queue = getQueue();
    queue.push({
        ...request,
        timestamp: Date.now(),
        id: crypto.randomUUID(),
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const getQueue = () => {
    const queue = localStorage.getItem(QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
};

export const removeFromQueue = (id) => {
    const queue = getQueue().filter((req) => req.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const clearQueue = () => {
    localStorage.removeItem(QUEUE_KEY);
};

export const processQueue = async (api) => {
    const queue = getQueue();

    for (const request of queue) {
        try {
            await api({
                method: request.method,
                url: request.url,
                data: request.data,
            });
            removeFromQueue(request.id);
        } catch (error) {
            console.error('Failed to process queued request:', error);
            // Keep in queue for retry later
        }
    }
};
