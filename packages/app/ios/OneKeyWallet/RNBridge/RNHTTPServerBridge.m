//
//  HTTPServerManager.m
//  HTTPServer
//
//  Created by Nicolas Martinez on 4/28/20.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RNHTTPServer, NSObject)

RCT_EXTERN_METHOD(startServer: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(stopServer)
RCT_EXTERN_METHOD(response: (NSString *) requestId  status: (NSInteger *) status responseData: (NSString *)data)

@end
