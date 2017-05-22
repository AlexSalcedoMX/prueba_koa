import tweets from '../models/tweet_model'
import mongoose from 'mongoose';
import loggerUtil from './../utils/logger';

const logger = loggerUtil.getInstance();

import {Search} from '../utils/validators';

function getGeneral(ctx){
    const contextRequest = ctx.request;
    const contextResponse = ctx.response;
    
    let params = contextRequest.body;
    let search = new Search(params);

    return search.paramsValid(params).then(valid => {

        let general = {};

        if( !valid ){
            throw new Error ('Invalid Request');
        }

        return Promise.all([  
        getMentions(params),
        getHashtags(params),
        getUsers(params),
        getNumberTweets(params)
        ]).then(resultsPromises => {
            return general = {mentions: resultsPromises[0],hashtags: resultsPromises[1],users: resultsPromises[2],tweets:resultsPromises[3]};
        });
        
    })
    .then((all) => {
        contextResponse.body = all;
    })
    .catch(error => {
        logger.error(error);
        contextResponse.status = 404;
    });
}

function getNumberTweets(params){
    return tweets.find({
        busquedaId: params.searchId,
        postedTime: { 
            $gte: new Date(`${params.initialDate} UTC`),
            $lte: new Date(`${params.finalDate} UTC`)
        }
    })
    .count()
    .exec()
    .then(tweets => {
        return tweets;
    })
    .catch(error => {
        logger.error(error);
    })
}

function getMentions(params){

    return tweets.aggregate()
    .match({
        busquedaId: params.searchId,
        postedTime: { 
            $gte: new Date(`${params.initialDate} UTC`),
            $lte: new Date(`${params.finalDate} UTC`)
        }
    })
    .unwind("$menciones")
    .group({
        _id: "$menciones",
        total: {$sum : 1}
    })
    .exec()
    .then(mentions => {
        return mentions.length;
    })
    .catch(error => {
        logger.error(error);
    })
}

function getHashtags(params){
    return tweets.aggregate()
    .match({
        busquedaId: params.searchId,
        postedTime: { 
            $gte: new Date(`${params.initialDate} UTC`),
            $lte: new Date(`${params.finalDate} UTC`)
        }
    })
    .unwind("$hashtags")
    .group({
        _id: "$hashtags",
        total: {$sum : 1}
    })
    .exec()
    .then(hashtags => {
        return hashtags.length;
    })
    .catch(error =>{
        logger.error(error);
    })
}

function getUsers(params){
   return tweets.aggregate()
    .match({
        busquedaId: params.searchId,
        postedTime: { 
            $gte: new Date(`${params.initialDate} UTC`),
            $lte: new Date(`${params.finalDate} UTC`)
        }
    })
    .group({
        _id: '$usuario.preferredUsername'
    })
    .exec()
    .then(users => {
        return users.length;
    })     
    .catch(error => {
        logger.error(error);
    })
}

export {getGeneral};