import tweets from '../models/tweet_model'
import mongoose from 'mongoose';
import loggerUtil from './../utils/logger';

const logger = loggerUtil.getInstance();

import {Search} from '../utils/validators';

function getMostActiveUser(ctx){
    const contextRequest = ctx.request;
    const contextResponse = ctx.response;
    
    let params = contextRequest.body;
    let search = new Search(params);

    return search.paramsValid().then(valid =>{
        if (!valid){
            throw new Error('Invalid Request');
        }

        return tweets.aggregate()
                .match({
                    busquedaId: params.searchId,
                    postedTime: { 
                        $gte: new Date(`${params.initialDate} UTC`),
                        $lte: new Date(`${params.finalDate} UTC`)
                    }
                })
                .group({
                    _id: '$usuario.preferredUsername',
                    total: { $sum: 1 }
                })
                .sort( { total: -1 } )
                .limit(1)
                .exec()
    })
    .then( mostActiveUser => {
        contextResponse.body = mostActiveUser;
    })
    .catch( error => {
        logger.error(error);
        contextResponse.status = 404;
    })
} 

export {getMostActiveUser};