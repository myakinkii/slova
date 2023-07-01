using {cc.slova.model as db} from '../db/schema';

@path: '/onboard'
service OnboardService {
    type Creds {
        id  : UUID;
        pwd : String
    };

    action generateUser()                                    returns Creds;
    action claimUser(id : UUID, pwd : String, name : String) returns String;
    action generatePin(id : UUID, pwd : String)              returns String;
    action fetchCreds(pin : String, name : String)           returns Creds;
}
