var config = {
        container: "#basic-example",
        
        connectors: {
            type: 'step'
        },
        node: {
            HTMLclass: 'nodeExample1'
        }
    },
    ceo = {
        text: {
            name: "Mark Hill",
            title: "Chief Executive Officer",
            //contact: "Tel: 01 213 123 134",
        },
        image: "../aeon-img/6197604464770.jpg"
    },

    cto = {
        parent: ceo,
        text:{
            name: "Joe Linux",
            title: "Chief Technology Officer",
        },
        stackChildren: true,
        image: "../aeon-img/6197604617356.jpg"
    },
    cbo = {
        parent: ceo,
        stackChildren: true,
        text:{
            name: "Linda May",
            title: "Chief Business Officer",
        },
        image: "../aeon-img/6197604675895.jpg"
    },
    cdo = {
        parent: ceo,
        text:{
            name: "John Green",
            title: "Chief Accounting Officer",
           // contact: "Tel: 01 213 123 134",
        },
        image: "../aeon-img/6197604646547.jpg"
    },
    cio = {
        parent: cto,
        text:{
            name: "Ron Blomquist",
            title: "Network Director"
        },
        image: "../aeon-img/6197604496003.jpg"
    },
    ciso = {
        parent: cto,
        text:{
            name: "Michael Rubin",
            title: "IT Director",
            //contact: {val: "we@aregreat.com", href: "mailto:we@aregreat.com"}
        },
        image: "../aeon-img/6197604531152.jpg"
    },
    cio2 = {
        parent: cdo,
        text:{
            name: "Erica Reel",
            title: "Acounting Director"
        },
//        link: {
//            href: "http://www.google.com"
//        },
        image: "../aeon-img/6197604561226.jpg"
    },
    ciso2 = {
        parent: cbo,
        text:{
            name: "Alice Lopez",
            title: "Sale Director"
        },
        image: "../aeon-img/6197604592086.jpg"
    },
    ciso3 = {
        parent: cbo,
        text:{
            name: "Mary Johnson",
            title: "Marketing Director"
        },
        image: "../aeon-img/6197604704686.jpg"
    },
    ciso4 = {
        parent: cbo,
        text:{
            name: "Kirk Douglas",
            title: "Digital Director"
        },
        image: "../aeon-img/6197604732449.jpg"
    }

    chart_config = [
        config,
        ceo,
        cto,
        cbo,
        cdo,
        cio,
        ciso,
        cio2,
        ciso2,
        ciso3,
        ciso4
    ];




    // Antoher approach, same result
    // JSON approach

/*
    var chart_config = {
        chart: {
            container: "#basic-example",
            
            connectors: {
                type: 'step'
            },
            node: {
                HTMLclass: 'nodeExample1'
            }
        },
        nodeStructure: {
            text: {
                name: "Mark Hill",
                title: "Chief executive officer",
                contact: "Tel: 01 213 123 134",
            },
            image: "../aeon-img/2.jpg",
            children: [
                {
                    text:{
                        name: "Joe Linux",
                        title: "Chief Technology Officer",
                    },
                    stackChildren: true,
                    image: "../aeon-img/1.jpg",
                    children: [
                        {
                            text:{
                                name: "Ron Blomquist",
                                title: "Chief Information Security Officer"
                            },
                            image: "../aeon-img/8.jpg"
                        },
                        {
                            text:{
                                name: "Michael Rubin",
                                title: "Chief Innovation Officer",
                                contact: "we@aregreat.com"
                            },
                            image: "../aeon-img/9.jpg"
                        }
                    ]
                },
                {
                    stackChildren: true,
                    text:{
                        name: "Linda May",
                        title: "Chief Business Officer",
                    },
                    image: "../aeon-img/5.jpg",
                    children: [
                        {
                            text:{
                                name: "Alice Lopez",
                                title: "Chief Communications Officer"
                            },
                            image: "../aeon-img/7.jpg"
                        },
                        {
                            text:{
                                name: "Mary Johnson",
                                title: "Chief Brand Officer"
                            },
                            image: "../aeon-img/4.jpg"
                        },
                        {
                            text:{
                                name: "Kirk Douglas",
                                title: "Chief Business Development Officer"
                            },
                            image: "../aeon-img/11.jpg"
                        }
                    ]
                },
                {
                    text:{
                        name: "John Green",
                        title: "Chief accounting officer",
                        contact: "Tel: 01 213 123 134",
                    },
                    image: "../aeon-img/6.jpg",
                    children: [
                        {
                            text:{
                                name: "Erica Reel",
                                title: "Chief Customer Officer"
                            },
                            link: {
                                href: "http://www.google.com"
                            },
                            image: "../aeon-img/10.jpg"
                        }
                    ]
                }
            ]
        }
    };

*/