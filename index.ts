import * as awsx from "@pulumi/awsx";

// create VPC
let vpc = new awsx.ec2.Vpc("sample", {
    cidrBlock: "10.0.0.0/16",
    subnets: [
        {type: "public", location:{availabilityZone: "ap-northeast-1b", cidrBlock: "10.0.1.0/24"}},
        {type: "public", location:{availabilityZone: "ap-northeast-1c", cidrBlock: "10.0.2.0/24"}},
        {type: "public", location:{availabilityZone: "ap-northeast-1d", cidrBlock: "10.0.3.0/24"}},
    ]
})

let cluster = new awsx.ecs.Cluster("custom", { vpc });

// Create a load balancer to listen for requests and route them to the container.
let lb = new awsx.lb.NetworkListener("nginx", { 
    port: 80,
    vpc: vpc,
});

// Define the service, building and publishing our "./app/Dockerfile", and using the load balancer.
let service = new awsx.ecs.FargateService("nginx", {
    cluster,
    desiredCount: 2,
    taskDefinitionArgs: {
        containers: {
            nginx: {
                image: awsx.ecs.Image.fromPath("nginx", "./app"),
                memory: 512,
                portMappings: [ lb ],
            },
        },
    },
});

// Export the URL so we can easily access it.
export const url = lb.endpoint.hostname;